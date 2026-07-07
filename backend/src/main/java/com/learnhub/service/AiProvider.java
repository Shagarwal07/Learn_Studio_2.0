package com.learnhub.service;

public interface AiProvider {
    String ask(String prompt, String dynamicApiKey);
    boolean supports(String providerName);
}
