package com.learnhub.controller;

import com.learnhub.dto.ApiResponse;
import com.learnhub.dto.UserDTO;
import com.learnhub.dto.InstructorAnalyticsDTO;
import com.learnhub.entity.User;
import com.learnhub.repository.UserRepository;
import com.learnhub.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final CourseService courseService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getMe(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserDTO dto = UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
                
        return ResponseEntity.ok(ApiResponse.success(dto, "User profile retrieved successfully"));
    }

    @GetMapping("/instructor/analytics")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<InstructorAnalyticsDTO>> getInstructorAnalytics(Principal principal) {
        InstructorAnalyticsDTO analytics = courseService.getInstructorAnalytics(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(analytics, "Instructor analytics retrieved successfully"));
    }

    @GetMapping("/instructors")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getInstructors() {
        List<User> instructors = userRepository.findByRoleAndActiveTrue(User.Role.INSTRUCTOR);
        List<User> admins = userRepository.findByRoleAndActiveTrue(User.Role.ADMIN);
        
        List<UserDTO> dtos = new java.util.ArrayList<>();
        
        if (instructors != null) {
            for (User u : instructors) {
                dtos.add(UserDTO.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .role(u.getRole() != null ? u.getRole().name() : "INSTRUCTOR")
                        .build());
            }
        }
        if (admins != null) {
            for (User u : admins) {
                dtos.add(UserDTO.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .role(u.getRole() != null ? u.getRole().name() : "ADMIN")
                        .build());
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success(dtos, "Instructors retrieved successfully"));
    }
}
