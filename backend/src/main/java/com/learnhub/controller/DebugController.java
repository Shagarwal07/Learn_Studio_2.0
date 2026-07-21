package com.learnhub.controller;

import com.learnhub.entity.User;
import com.learnhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class DebugController {
    private final UserRepository userRepository;

    @GetMapping("/api/debug/users")
    public List<String> getUsers() {
        return userRepository.findAll().stream()
                .map(u -> u.getEmail() + " | " + u.getPassword())
                .collect(Collectors.toList());
    }
}
