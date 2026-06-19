import https from "https";
import fs from "fs";
import path from "path";

const fonts = [
  {
    name: "inter-regular.ttf",
    url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrj72A.ttf"
  },
  {
    name: "inter-bold.ttf",
    url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrj72A.ttf"
  },
  {
    name: "lora-italic.ttf",
    url: "https://fonts.gstatic.com/s/lora/v37/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFkqh8m9eY.ttf"
  },
  {
    name: "lora-regular.ttf",
    url: "https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787weuyJGmKpemQ.ttf"
  },
  {
    name: "lora-bold.ttf",
    url: "https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787z5vCJGmKpemQ.ttf"
  }
];

const outputDir = path.resolve("public/fonts");

function download(font) {
  return new Promise((resolve, reject) => {
    const dest = path.join(outputDir, font.name);
    const file = fs.createWriteStream(dest);
    https.get(font.url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          console.log(`Successfully downloaded: ${font.name}`);
          resolve();
        });
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function run() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const font of fonts) {
    try {
      await download(font);
    } catch (e) {
      console.error(`Error downloading ${font.name}:`, e);
    }
  }
}

run();
