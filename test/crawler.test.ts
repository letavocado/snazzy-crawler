import { getOnlyHostURLs, normalizeURL } from "../src/lib/utils";
import Crawler from "../src/lib/core";

test("normalizeURL slash", () => {
  const baseURL = "https://domain.com/";
  const normalizedURL = normalizeURL(baseURL);
  const expected = "https://domain.com";

  expect(expected).toEqual(normalizedURL);
});

test("normalizeURL add https", () => {
  const baseURL = "domain.com";
  const normalizedURL = normalizeURL(baseURL);
  const expected = "https://domain.com";

  expect(expected).toEqual(normalizedURL);
});

test("getOnlyHostURLs", () => {
  const baseURL = "https://domain.com";
  const urls = [
    "https://site.anotherdomain.com",
    "https://anotherdomain.com",
    "https://site.domain.com",
    "https://domain.com",
    "https://domain.com/#anchor",
    "https://domain.com/absolute/",
    "https://domain.com/absolute/#anchor",
    "/relative/#anchor",
    "/relative/link/",
    "/relative/link/#anchor",
  ];

  const hostOnlyURLs = getOnlyHostURLs(urls, baseURL);
  const expected = [
    "https://domain.com/",
    "https://domain.com/absolute/",
    "https://domain.com/relative/",
    "https://domain.com/relative/link/",
  ];

  expect(hostOnlyURLs).toEqual(expected);
});

test("getCrawler baseURL", async () => {
  const normalizedURL = normalizeURL("duck.com");
  const depth = 4;
  const crawler = await Crawler.init(normalizedURL, depth);
  expect(crawler.baseURL).toEqual(normalizedURL);
});

test("getCrawler depth", async () => {
  const normalizedURL = normalizeURL("duck.com");
  const depth = 4;
  const crawler = await Crawler.init(normalizedURL, depth);
  expect(crawler.depth).toEqual(depth);
});

test("Get images from nuxt.com homepage", async () => {
  const normalizedURL = normalizeURL("nuxt.com");
  const depth = 0;
  const nuxtHomePageImages = 60;
  const crawler = await Crawler.init(normalizedURL, depth);
  await crawler.run();
  expect(nuxtHomePageImages).toEqual(crawler.result.length);
}, 20000);
