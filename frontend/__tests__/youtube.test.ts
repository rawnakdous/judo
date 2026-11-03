import { extractYouTubeVideoId, toYouTubeEmbedUrl } from "@/utils/youtube";

describe("youtube utilities", () => {
  it("supports the required URL formats", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=abc_DEF-123")).toBe("abc_DEF-123");
    expect(extractYouTubeVideoId("https://youtu.be/abc_DEF-123")).toBe("abc_DEF-123");
    expect(extractYouTubeVideoId("https://www.youtube.com/live/abc_DEF-123")).toBe("abc_DEF-123");
  });

  it("creates trusted embed urls only", () => {
    expect(toYouTubeEmbedUrl("https://example.com/live/abc_DEF-123")).toBeNull();
    expect(toYouTubeEmbedUrl("https://youtu.be/abc_DEF-123")).toContain("youtube.com/embed/abc_DEF-123");
  });
});
