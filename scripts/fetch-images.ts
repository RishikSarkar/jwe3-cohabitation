/**
 * Fetches dinosaur profile images and hover loop videos from the official JWE3 CDN,
 * with Fandom Wiki fallback for any missing images.
 * Run: npm run fetch-images [-- --refresh]
 */
import fs from "fs";
import path from "path";
import { slugify } from "../src/constants/canonical";

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "dinosaurs");
const MANIFEST = path.join(ROOT, "src", "data", "image-manifest.json");
const VIDEO_MANIFEST = path.join(ROOT, "src", "data", "video-manifest.json");
const DINOS = path.join(ROOT, "src", "data", "dinosaurs.json");

const JWE3_LISTING =
  "https://www.jurassicworldevolution.com/en-US/3/dinosaurs";
const WIKI_API = "https://jurassicworld-evolution.fandom.com/api.php";
const VIDEO_CDN = "https://hosting.zaonce.net/websites/jurassic-world-evolution-3/dinos";

type DinoRef = { id: string; name: string; image?: string; video?: string };

type OfficialAsset = {
  imageUrl: string;
  hash: string;
  fileName: string;
};

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pascalToId(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

function decodeImageServiceUrl(url: string): {
  key: string;
  width: number;
} | null {
  const token = url.split("image-service.zaonce.net/")[1]?.split(/[?"']/)[0];
  if (!token) return null;
  try {
    const json = JSON.parse(Buffer.from(token, "base64").toString("utf8")) as {
      key?: string;
      edits?: { resize?: { width?: number } };
    };
    if (!json.key?.includes("/dinos/")) return null;
    return {
      key: json.key,
      width: json.edits?.resize?.width ?? 0,
    };
  } catch {
    return null;
  }
}

function highResImageServiceUrl(url: string): string {
  const token = url.split("image-service.zaonce.net/")[1]?.split(/[?"']/)[0];
  if (!token) return url;
  try {
    const json = JSON.parse(Buffer.from(token, "base64").toString("utf8")) as {
      bucket?: string;
      key?: string;
      edits?: {
        webp?: { quality?: number };
        toFormat?: string;
        resize?: { width?: number; fit?: string };
        version?: string;
      };
    };
    if (!json.key) return url;
    json.edits = {
      ...json.edits,
      webp: { quality: 90 },
      toFormat: "webp",
      resize: { width: 512, fit: "contain" },
    };
    return `https://image-service.zaonce.net/${Buffer.from(JSON.stringify(json)).toString("base64")}`;
  } catch {
    return url;
  }
}

function officialVideoUrl(hash: string, fileName: string): string {
  const stem = fileName.replace(/\.png$/i, "");
  return `${VIDEO_CDN}/${hash}/${stem}_180.webm`;
}

async function fetchOfficialAssetMap(): Promise<Map<string, OfficialAsset>> {
  const res = await fetch(JWE3_LISTING, {
    headers: { "User-Agent": "jwe3-cohabitation/1.0 (fan tool)" },
  });
  if (!res.ok) throw new Error(`JWE3 listing fetch failed: ${res.status}`);

  const html = await res.text();
  const urls = [
    ...html.matchAll(
      /https:\/\/image-service\.zaonce\.net\/[A-Za-z0-9+/=_-]+/g,
    ),
  ].map((m) => m[0]);

  const byFile = new Map<string, OfficialAsset>();
  for (const url of urls) {
    const decoded = decodeImageServiceUrl(url);
    if (!decoded) continue;
    const parts = decoded.key.split("/");
    const file = parts.pop() ?? "";
    const hash = parts.pop() ?? "";
    if (!/\.png$/i.test(file) || !hash) continue;

    const prev = byFile.get(file);
    if (!prev || decoded.width > (prev.imageUrl ? 432 : 0)) {
      byFile.set(file, {
        imageUrl: highResImageServiceUrl(url),
        hash,
        fileName: file,
      });
    }
  }

  const map = new Map<string, OfficialAsset>();
  for (const [file, asset] of byFile) {
    const stem = file.replace(/\.png$/i, "");
    const keys = new Set([
      normalizeKey(stem),
      pascalToId(stem),
      slugify(stem.replace(/([a-z0-9])([A-Z])/g, "$1 $2")),
    ]);
    for (const key of keys) map.set(key, asset);
  }
  return map;
}

async function wikiImageUrl(fileName: string): Promise<string | null> {
  const url = `${WIKI_API}?action=query&format=json&prop=imageinfo&titles=File:${encodeURIComponent(fileName)}&iiprop=url&iiurlwidth=400`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0] as {
    missing?: boolean;
    imageinfo?: { url: string }[];
  };
  if (page.missing || !page.imageinfo?.[0]?.url) return null;
  return page.imageinfo[0].url;
}

function candidateFileNames(name: string): string[] {
  const base = name.replace(/\s+/g, "_");
  return [
    `${base}_JWE3_Profile.png`,
    `${base}_database_image_from_Evolution_3.png`,
    `${base}_database_image_from_Jurassic_World_Evolution_3.png`,
    `${base}_JWE2_Profile.png`,
    `${base}_database_image_from_Evolution_2.png`,
    `JWE_${base}.png`,
  ];
}

async function downloadFile(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "jwe3-cohabitation/1.0 (fan tool)" },
    });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

function resolveOfficialAsset(
  dino: DinoRef,
  official: Map<string, OfficialAsset>,
): OfficialAsset | undefined {
  const candidates = [
    dino.id,
    pascalToId(dino.name.replace(/\s+/g, "")),
    slugify(dino.name),
    normalizeKey(dino.name),
    normalizeKey(dino.id),
  ];
  for (const key of candidates) {
    const asset = official.get(key);
    if (asset) return asset;
  }
  return undefined;
}

async function main() {
  const dinos: DinoRef[] = JSON.parse(fs.readFileSync(DINOS, "utf-8"));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("Fetching official JWE3 dinosaur listing…");
  const official = await fetchOfficialAssetMap();
  console.log(`Found ${official.size} official profile entries`);

  const refresh = process.argv.includes("--refresh");
  const imageManifest: Record<string, string | null> = {};
  const videoManifest: Record<string, string | null> = {};
  let imgOk = 0;
  let imgFail = 0;
  let imgOfficial = 0;
  let vidOk = 0;
  let vidFail = 0;

  for (const dino of dinos) {
    const destPng = path.join(OUT_DIR, `${dino.id}.png`);
    const destWebp = path.join(OUT_DIR, `${dino.id}.webp`);
    const destVideo = path.join(OUT_DIR, `${dino.id}.webm`);
    const existingImg = fs.existsSync(destPng)
      ? destPng
      : fs.existsSync(destWebp)
        ? destWebp
        : null;
    const existingVideo = fs.existsSync(destVideo) ? destVideo : null;

    // --- Image ---
    if (existingImg && !refresh) {
      imageManifest[dino.id] = `/dinosaurs/${path.basename(existingImg)}`;
      imgOk++;
    } else {
      let fetched = false;
      const asset = resolveOfficialAsset(dino, official);
      if (asset) {
        const ext = asset.imageUrl.includes("webp") ? ".webp" : ".png";
        const dest = path.join(OUT_DIR, `${dino.id}${ext}`);
        if (await downloadFile(asset.imageUrl, dest)) {
          imageManifest[dino.id] = `/dinosaurs/${dino.id}${ext}`;
          imgOk++;
          imgOfficial++;
          fetched = true;
        }
        await new Promise((r) => setTimeout(r, 100));
      }

      if (!fetched) {
        for (const fileName of candidateFileNames(dino.name)) {
          const imageUrl = await wikiImageUrl(fileName);
          if (!imageUrl) continue;

          const ext = imageUrl.includes(".png") ? ".png" : ".jpg";
          const dest = path.join(OUT_DIR, `${dino.id}${ext}`);
          if (await downloadFile(imageUrl, dest)) {
            imageManifest[dino.id] = `/dinosaurs/${dino.id}${ext}`;
            imgOk++;
            fetched = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 150));
        }
      }

      if (!fetched) {
        imageManifest[dino.id] = null;
        imgFail++;
      }
    }

    // --- Hover video ---
    if (existingVideo && !refresh) {
      videoManifest[dino.id] = `/dinosaurs/${dino.id}.webm`;
      vidOk++;
    } else {
      const asset = resolveOfficialAsset(dino, official);
      if (asset) {
        const videoUrl = officialVideoUrl(asset.hash, asset.fileName);
        if (await downloadFile(videoUrl, destVideo)) {
          videoManifest[dino.id] = `/dinosaurs/${dino.id}.webm`;
          vidOk++;
        } else {
          videoManifest[dino.id] = null;
          vidFail++;
        }
        await new Promise((r) => setTimeout(r, 100));
      } else {
        videoManifest[dino.id] = null;
        vidFail++;
      }
    }

    await new Promise((r) => setTimeout(r, 80));
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(imageManifest, null, 2));
  fs.writeFileSync(VIDEO_MANIFEST, JSON.stringify(videoManifest, null, 2));

  const dinosFull: DinoRef[] = JSON.parse(fs.readFileSync(DINOS, "utf-8"));
  for (const d of dinosFull) {
    const imgPath = imageManifest[d.id];
    const vidPath = videoManifest[d.id];
    if (imgPath) d.image = imgPath;
    if (vidPath) d.video = vidPath;
    else delete d.video;
  }
  fs.writeFileSync(DINOS, JSON.stringify(dinosFull, null, 2));

  console.log(
    `Images: ${imgOk} found (${imgOfficial} from JWE3), ${imgFail} missing`,
  );
  console.log(`Videos: ${vidOk} found, ${vidFail} missing → ${VIDEO_MANIFEST}`);
}

main().catch(console.error);
