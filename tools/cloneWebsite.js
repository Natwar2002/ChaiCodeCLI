import fs from "fs";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import beautify from "js-beautify";

export default async function cloneWebsite(url, outputDir = "output") {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    // subdirectories for assets
    const dirs = {
        css: path.join(outputDir, "css"),
        js: path.join(outputDir, "js"),
        images: path.join(outputDir, "images"),
        videos: path.join(outputDir, "videos"),
    };

    Object.values(dirs).forEach((dir) => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    let tasks = [];

    // CSS
    $("link[rel='stylesheet']").each((_, el) => {
        const href = $(el).attr("href");
        if (href) {
            tasks.push(
                (async () => {
                    try {
                        const cssUrl = new URL(href, url).href;
                        const { data: css } = await axios.get(cssUrl);
                        const fileName = path.basename(cssUrl.split("?")[0]) || "style.css";
                        const filePath = path.join(dirs.css, fileName);

                        // format CSS
                        const formattedCss = beautify.css(css, { indent_size: 2 });

                        fs.writeFileSync(filePath, formattedCss, "utf-8");
                        $(el).attr("href", `css/${fileName}`);
                    } catch {
                        console.error("CSS fetch failed:", href);
                    }
                })()
            );
        }
    });

    // JS
    $("script[src]").each((_, el) => {
        const src = $(el).attr("src");
        if (src) {
            tasks.push(
                (async () => {
                    try {
                        const jsUrl = new URL(src, url).href;
                        const { data: js } = await axios.get(jsUrl);
                        const fileName = path.basename(jsUrl.split("?")[0]) || "script.js";
                        const filePath = path.join(dirs.js, fileName);

                        // format JS
                        const formattedJs = beautify.js(js, { indent_size: 2 });

                        fs.writeFileSync(filePath, formattedJs, "utf-8");
                        $(el).attr("src", `js/${fileName}`);
                    } catch {
                        console.error("JS fetch failed:", src);
                    }
                })()
            );
        }
    });


    // Images
    $("img").each((_, el) => {
        const src = $(el).attr("src");
        if (src) {
            tasks.push(
                (async () => {
                    try {
                        const imgUrl = new URL(src, url).href;
                        const { data: img } = await axios.get(imgUrl, { responseType: "arraybuffer" });
                        const fileName = path.basename(imgUrl.split("?")[0]) || "image.png";
                        const filePath = path.join(dirs.images, fileName);
                        fs.writeFileSync(filePath, img);
                        $(el).attr("src", `images/${fileName}`);
                    } catch {
                        console.error("Image fetch failed:", src);
                    }
                })()
            );
        }
    });

    // Videos
    $("video, source").each((_, el) => {
        const src = $(el).attr("src");
        if (src) {
            tasks.push(
                (async () => {
                    try {
                        const videoUrl = new URL(src, url).href;
                        const { data: video } = await axios.get(videoUrl, { responseType: "arraybuffer" });
                        const fileName = path.basename(videoUrl.split("?")[0]) || "video.mp4";
                        const filePath = path.join(dirs.videos, fileName);
                        fs.writeFileSync(filePath, video);
                        $(el).attr("src", `videos/${fileName}`);
                    } catch {
                        console.error("Video fetch failed:", src);
                    }
                })()
            );
        }
    });

    // Wait for all downloads to finish
    await Promise.all(tasks);

    // Save cleaned HTML
    fs.writeFileSync(path.join(outputDir, "index.html"), $.html(), "utf-8");

    console.log(`✅ Website cloned into ${outputDir}`);
}