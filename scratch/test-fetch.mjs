import https from "https";

const url = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&display=swap";

const options = {
  headers: {
    // Android 2.2 user agent forces TTF format from Google Fonts
    "User-Agent": "Mozilla/5.0 (Linux; U; Android 2.2; en-us; Nexus One Build/FRF91) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1"
  }
};

https.get(url, options, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log(data);
  });
}).on("error", (err) => {
  console.error(err);
});
