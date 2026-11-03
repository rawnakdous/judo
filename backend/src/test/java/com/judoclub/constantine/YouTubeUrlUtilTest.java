package com.judoclub.constantine;

import com.judoclub.constantine.util.YouTubeUrlUtil;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class YouTubeUrlUtilTest {
    @Test
    void extractsSupportedYoutubeUrls() {
        assertThat(YouTubeUrlUtil.extractVideoId("https://www.youtube.com/watch?v=abc_DEF-123")).isEqualTo("abc_DEF-123");
        assertThat(YouTubeUrlUtil.extractVideoId("https://youtu.be/abc_DEF-123")).isEqualTo("abc_DEF-123");
        assertThat(YouTubeUrlUtil.extractVideoId("https://www.youtube.com/live/abc_DEF-123")).isEqualTo("abc_DEF-123");
    }

    @Test
    void rejectsExternalUrls() {
        assertThat(YouTubeUrlUtil.extractVideoId("https://example.com/live/abc_DEF-123")).isNull();
    }
}
