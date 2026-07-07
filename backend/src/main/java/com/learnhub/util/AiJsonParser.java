package com.learnhub.util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class AiJsonParser {

    private static final ObjectMapper mapper = new ObjectMapper()
            .enable(JsonParser.Feature.ALLOW_COMMENTS)
            .enable(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES)
            .enable(JsonParser.Feature.ALLOW_SINGLE_QUOTES)
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    /**
     * Extracts and cleans JSON from a raw AI response, removing markdown blocks and conversational text.
     */
    public static String extractJson(String rawResponse) {
        if (rawResponse == null || rawResponse.trim().isEmpty()) {
            return "{}";
        }

        String cleaned = rawResponse.trim();

        // 1. Try to extract from markdown code blocks
        Pattern markdownPattern = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)\\s*```", Pattern.CASE_INSENSITIVE);
        Matcher matcher = markdownPattern.matcher(cleaned);
        if (matcher.find()) {
            cleaned = matcher.group(1).trim();
        } else {
            // 2. If no code blocks, try to find the first { or [ and last } or ]
            int firstBrace = cleaned.indexOf('{');
            int firstBracket = cleaned.indexOf('[');
            int lastBrace = cleaned.lastIndexOf('}');
            int lastBracket = cleaned.lastIndexOf(']');

            int start = -1;
            int end = -1;

            if (firstBrace != -1 && firstBracket != -1) {
                start = Math.min(firstBrace, firstBracket);
            } else if (firstBrace != -1) {
                start = firstBrace;
            } else if (firstBracket != -1) {
                start = firstBracket;
            }

            if (lastBrace != -1 && lastBracket != -1) {
                end = Math.max(lastBrace, lastBracket);
            } else if (lastBrace != -1) {
                end = lastBrace;
            } else if (lastBracket != -1) {
                end = lastBracket;
            }

            if (start != -1 && end != -1 && end > start) {
                cleaned = cleaned.substring(start, end + 1);
            }
        }

        return cleaned;
    }

    public static ObjectMapper getMapper() {
        return mapper;
    }
}
