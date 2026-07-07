package com.learnhub.service;

import com.learnhub.entity.Note;
import com.learnhub.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RagService {

    private final NoteRepository noteRepository;
    private final java.util.Map<String, String> ragCache = new java.util.concurrent.ConcurrentHashMap<>();

    public String retrieveContext(String courseTitle, String subjectName, String topics) {
        if (courseTitle == null || subjectName == null || topics == null || topics.trim().isEmpty()) {
            return null;
        }

        String cacheKey = courseTitle.toLowerCase() + "|" + subjectName.toLowerCase() + "|" + topics.toLowerCase();
        if (ragCache.containsKey(cacheKey)) {
            System.out.println("⚡ [RagService] Cache HIT for key: " + cacheKey);
            return ragCache.get(cacheKey);
        }

        try {
            // 1. Fetch all notes in the database
            List<Note> allNotes = noteRepository.findAll();
            if (allNotes.isEmpty()) {
                return null;
            }

            // 2. Filter notes matching subjectName (case-insensitive) and courseTitle (containing, case-insensitive)
            String querySubject = subjectName.trim().toLowerCase();
            String queryCourse = courseTitle.trim().toLowerCase();

            List<Note> matchedNotes = allNotes.stream()
                .filter(n -> n.getSubjectName() != null && n.getSubjectName().trim().toLowerCase().contains(querySubject))
                .filter(n -> n.getCourse() != null && n.getCourse().getTitle() != null &&
                             n.getCourse().getTitle().trim().toLowerCase().contains(queryCourse))
                .filter(n -> n.getExtractedText() != null && !n.getExtractedText().trim().isEmpty())
                .toList();

            if (matchedNotes.isEmpty()) {
                System.out.println("RAG retrieve: No study material notes found in PostgreSQL for subject=" + subjectName + ", class=" + courseTitle);
                return null;
            }

            // 3. Split note texts into paragraph chunks (approx 600-800 characters)
            List<String> chunks = new ArrayList<>();
            for (Note note : matchedNotes) {
                String text = note.getExtractedText();
                String[] paragraphs = text.split("\\n+");
                StringBuilder currentChunk = new StringBuilder();

                for (String p : paragraphs) {
                    p = p.trim();
                    if (p.isEmpty()) continue;

                    if (currentChunk.length() + p.length() > 800) {
                        chunks.add(currentChunk.toString().trim());
                        currentChunk = new StringBuilder();
                    }
                    currentChunk.append(p).append("\n");
                }
                if (currentChunk.length() > 0) {
                    chunks.add(currentChunk.toString().trim());
                }
            }

            if (chunks.isEmpty()) {
                return null;
            }

            // 4. Tokenize the topics list to find relevant keywords for ranking
            Set<String> keywords = Arrays.stream(topics.toLowerCase().split("[^a-zA-Z0-9]+"))
                .filter(word -> word.length() > 3) // filter out tiny common words
                .collect(Collectors.toSet());

            if (keywords.isEmpty()) {
                // Return first few chunks if no keywords
                String res = chunks.stream().limit(3).collect(Collectors.joining("\n\n"));
                ragCache.put(cacheKey, res);
                return res;
            }

            // 5. Score chunks based on keyword matching
            Map<String, Integer> chunkScores = new HashMap<>();
            for (String chunk : chunks) {
                String chunkLower = chunk.toLowerCase();
                int score = 0;
                for (String word : keywords) {
                    if (chunkLower.contains(word)) {
                        score++;
                    }
                }
                chunkScores.put(chunk, score);
            }

            // 6. Sort chunks by score descending and pick top 4 relevant chunks (with score > 0)
            List<String> sortedChunks = chunks.stream()
                .filter(c -> chunkScores.getOrDefault(c, 0) > 0)
                .sorted((c1, c2) -> Integer.compare(chunkScores.getOrDefault(c2, 0), chunkScores.getOrDefault(c1, 0)))
                .limit(4)
                .toList();

            if (sortedChunks.isEmpty()) {
                // If keyword filtering returns nothing, fallback to top 2 chunks as context
                String res = chunks.stream().limit(2).collect(Collectors.joining("\n\n"));
                ragCache.put(cacheKey, res);
                return res;
            }

            System.out.println("RAG retrieve: Successfully matched " + sortedChunks.size() + " chunks from notes.");
            String res = String.join("\n\n---\n\n", sortedChunks);
            ragCache.put(cacheKey, res);
            return res;

        } catch (Exception e) {
            System.err.println("Warning: RAG retrieval failed: " + e.getMessage());
            return null; // Skip silently on failure
        }
    }
}
