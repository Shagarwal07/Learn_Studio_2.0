package com.learnhub.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.cloud.firestore.WriteResult;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.Map;
import java.util.UUID;

@Service
public class FirestoreService {

    private Firestore firestore;

    @PostConstruct
    public void init() {
        // Initializes Firestore with custom database ID
        FirestoreOptions firestoreOptions = FirestoreOptions.getDefaultInstance().toBuilder()
                .setDatabaseId("auto-paper-gen")
                .build();
        this.firestore = firestoreOptions.getService();
    }

    /**
     * Saves a generated paper to Firestore and returns the generated document ID.
     */
    public String savePaper(Map<String, Object> paperData) throws Exception {
        String docId = UUID.randomUUID().toString();
        ApiFuture<WriteResult> future = firestore.collection("auto_ta_papers").document(docId).set(paperData);
        future.get(); // block until complete
        return docId;
    }

    /**
     * Retrieves a generated paper from Firestore.
     */
    public Map<String, Object> getPaper(String documentId) throws Exception {
        DocumentReference docRef = firestore.collection("auto_ta_papers").document(documentId);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        if (document.exists()) {
            return document.getData();
        } else {
            return null;
        }
    }

    /**
     * Saves a snapshot version to the versions sub-collection.
     */
    public String savePaperVersion(String documentId, Map<String, Object> versionData) throws Exception {
        String versionId = UUID.randomUUID().toString();
        ApiFuture<WriteResult> future = firestore
            .collection("auto_ta_papers")
            .document(documentId)
            .collection("versions")
            .document(versionId)
            .set(versionData);
        future.get();
        return versionId;
    }

    /**
     * Fetches all snapshot versions from the versions sub-collection.
     */
    public java.util.List<Map<String, Object>> getPaperVersions(String documentId) throws Exception {
        ApiFuture<com.google.cloud.firestore.QuerySnapshot> future = firestore
            .collection("auto_ta_papers")
            .document(documentId)
            .collection("versions")
            .orderBy("timestamp", com.google.cloud.firestore.Query.Direction.DESCENDING)
            .get();
            
        com.google.cloud.firestore.QuerySnapshot snapshot = future.get();
        java.util.List<Map<String, Object>> versions = new java.util.ArrayList<>();
        for (com.google.cloud.firestore.QueryDocumentSnapshot doc : snapshot.getDocuments()) {
            Map<String, Object> data = doc.getData();
            data.put("id", doc.getId()); // Store the version ID
            versions.add(data);
        }
        return versions;
    }

    /**
     * Helper to fetch questions as a list of GeneratedQuestionDTO.
     */
    public java.util.List<com.learnhub.dto.GeneratedQuestionDTO> getQuestionsForPaper(String documentId) {
        try {
            Map<String, Object> doc = getPaper(documentId);
            if (doc != null && doc.containsKey("questions")) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                return mapper.convertValue(
                    doc.get("questions"),
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.List<com.learnhub.dto.GeneratedQuestionDTO>>() {}
                );
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new java.util.ArrayList<>();
    }
}
