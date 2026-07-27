package com.learnhub.controller;

import com.learnhub.dto.ApiResponse;
import com.learnhub.dto.UserDTO;
import com.learnhub.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import javax.sql.DataSource;
import java.sql.*;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final DataSource dataSource;
    private final AdminService adminService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final com.learnhub.service.EmailService emailService;
    private final com.learnhub.repository.UserRepository userRepository;
    private final com.learnhub.repository.UserIdentityProfileRepository userIdentityProfileRepository;

    @PostMapping("/send-welcome-credentials")
    public ResponseEntity<ApiResponse<String>> sendWelcomeCredentials(
            @RequestParam("email") String email,
            @RequestParam("studentName") String studentName,
            @RequestParam("password") String password,
            @RequestParam(value = "batchName", required = false) String batchName) {
        
        String targetRecipientEmail = null;

        // Strictly fetch real Google email from user_identity_profile table in DB
        Optional<com.learnhub.entity.User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            List<com.learnhub.entity.UserIdentityProfile> profiles = userIdentityProfileRepository.findByUserId(userOpt.get().getId());
            for (com.learnhub.entity.UserIdentityProfile p : profiles) {
                if (p.getGoogleEmail() != null && !p.getGoogleEmail().isBlank() && p.getGoogleEmail().contains("@") && !p.getGoogleEmail().toLowerCase().endsWith("@example.com")) {
                    targetRecipientEmail = p.getGoogleEmail();
                    break;
                }
            }
        }

        // Check if the login email itself is a real deliverable email (not dummy @example.com)
        if (targetRecipientEmail == null && email != null && email.contains("@") && !email.toLowerCase().endsWith("@example.com")) {
            targetRecipientEmail = email;
        }

        if (targetRecipientEmail == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Cannot send email: Student (" + studentName + ") does not have a real Google Email linked in the database. Please add a valid Google Email profile for this student."));
        }

        emailService.sendStudentWelcomeCredentials(targetRecipientEmail, studentName, email, password, batchName);
        return ResponseEntity.ok(ApiResponse.success("Welcome credentials email dispatched successfully to real Google Email (" + targetRecipientEmail + ")", "Email Sent"));
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            jdbcTemplate.execute("ALTER TABLE user_identity_profile DROP CONSTRAINT IF EXISTS uk_user_identity_profile_google_email;");
            jdbcTemplate.execute("ALTER TABLE user_identity_profile DROP CONSTRAINT IF EXISTS uk_user_identity_profile_google_sub;");
            jdbcTemplate.execute("ALTER TABLE user_identity_profile DROP CONSTRAINT IF EXISTS user_identity_profile_google_email_key;");
            jdbcTemplate.execute("ALTER TABLE user_identity_profile DROP CONSTRAINT IF EXISTS user_identity_profile_google_sub_key;");
        } catch (Exception e) {
            System.err.println("Failed to drop constraints: " + e.getMessage());
        }
    }

    // ── User Management CRUD ──

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers(), "Users retrieved successfully"));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserDTO>> createUser(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String email = (String) body.get("email");
        String role = (String) body.get("role");
        String password = (String) body.get("password");
        Long batchId = body.get("batchId") != null ? Long.valueOf(body.get("batchId").toString()) : null;
        String primaryGoogleEmail = (String) body.get("primaryGoogleEmail");
        String secondaryGoogleEmail = (String) body.get("secondaryGoogleEmail");

        UserDTO dto = UserDTO.builder()
                .name(name)
                .email(email)
                .role(role)
                .batchId(batchId)
                .primaryGoogleEmail(primaryGoogleEmail)
                .secondaryGoogleEmail(secondaryGoogleEmail)
                .build();

        UserDTO created = adminService.createUser(dto, password);
        return ResponseEntity.ok(ApiResponse.success(created, "User created successfully"));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String email = (String) body.get("email");
        String role = (String) body.get("role");
        String password = (String) body.get("password");
        Long batchId = body.get("batchId") != null ? Long.valueOf(body.get("batchId").toString()) : null;
        String primaryGoogleEmail = (String) body.get("primaryGoogleEmail");
        String secondaryGoogleEmail = (String) body.get("secondaryGoogleEmail");

        UserDTO dto = UserDTO.builder()
                .name(name)
                .email(email)
                .role(role)
                .batchId(batchId)
                .primaryGoogleEmail(primaryGoogleEmail)
                .secondaryGoogleEmail(secondaryGoogleEmail)
                .build();

        UserDTO updated = adminService.updateUser(id, dto, password);
        return ResponseEntity.ok(ApiResponse.success(updated, "User updated successfully"));
    }

    @PatchMapping("/users/{id}/deactivate")
    public ResponseEntity<ApiResponse<UserDTO>> deactivateUser(@PathVariable Long id, java.security.Principal principal) {
        UserDTO deactivated = adminService.deactivateUser(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(deactivated, "User deactivated successfully"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    @GetMapping("/users/export")
    public ResponseEntity<byte[]> exportUsers() {
        String csvContent = adminService.exportUsersToCsvContent();
        byte[] csvBytes = csvContent.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"users.csv\"")
                .contentType(org.springframework.http.MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }

    @PostMapping(value = "/users/import", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> importUsers(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "deleteUnfound", defaultValue = "false") boolean deleteUnfound) {
        try {
            Map<String, Object> result = adminService.importUsersFromCsvContent(file.getInputStream(), deleteUnfound);
            return ResponseEntity.ok(ApiResponse.success(result, "Users synchronized from CSV successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to import/sync users: " + e.getMessage()));
        }
    }

    // ── Execute any SQL (SELECT → rows, others → affected rows) ──
    @PostMapping("/sql")
    public ResponseEntity<ApiResponse<Map<String, Object>>> runSql(@RequestBody Map<String, String> body) {
        String sql = body.get("sql");
        if (sql == null || sql.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("SQL query cannot be empty"));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        long start = System.currentTimeMillis();

        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            boolean isSelect = sql.trim().toUpperCase().startsWith("SELECT") ||
                               sql.trim().toUpperCase().startsWith("SHOW") ||
                               sql.trim().toUpperCase().startsWith("DESCRIBE") ||
                               sql.trim().toUpperCase().startsWith("EXPLAIN");

            if (isSelect) {
                ResultSet rs = stmt.executeQuery(sql);
                ResultSetMetaData meta = rs.getMetaData();
                int cols = meta.getColumnCount();

                List<String> columns = new ArrayList<>();
                for (int i = 1; i <= cols; i++) {
                    columns.add(meta.getColumnName(i));
                }

                List<List<Object>> rows = new ArrayList<>();
                while (rs.next()) {
                    List<Object> row = new ArrayList<>();
                    for (int i = 1; i <= cols; i++) {
                        row.add(rs.getObject(i));
                    }
                    rows.add(row);
                }
                result.put("type", "SELECT");
                result.put("columns", columns);
                result.put("rows", rows);
                result.put("rowCount", rows.size());
            } else {
                int affected = stmt.executeUpdate(sql);
                result.put("type", "UPDATE");
                result.put("affectedRows", affected);
                result.put("message", "Query executed successfully. " + affected + " row(s) affected.");
            }

            result.put("executionMs", System.currentTimeMillis() - start);
            result.put("success", true);
            return ResponseEntity.ok(ApiResponse.success(result, "SQL executed successfully"));

        } catch (SQLException e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("executionMs", System.currentTimeMillis() - start);
            return ResponseEntity.ok(ApiResponse.success(result, "SQL execution failed: " + e.getMessage()));
        }
    }

    // ── List all tables ──────────────────────────────────────
    @GetMapping("/tables")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTables() {
        List<Map<String, Object>> tables = new ArrayList<>();
        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet rs = meta.getTables(conn.getCatalog(), null, "%", new String[]{"TABLE"});
            while (rs.next()) {
                Map<String, Object> t = new LinkedHashMap<>();
                String tableName = rs.getString("TABLE_NAME");
                t.put("name", tableName);
                
                // Get row count - escaping table name safely for PostgreSQL/MySQL
                try (Statement s = conn.createStatement();
                     ResultSet cr = s.executeQuery("SELECT COUNT(*) FROM \"" + tableName + "\"")) {
                    cr.next();
                    t.put("rowCount", cr.getLong(1));
                } catch (SQLException e) {
                    // Try without quotes just in case, or default to 0
                    try (Statement s2 = conn.createStatement();
                         ResultSet cr2 = s2.executeQuery("SELECT COUNT(*) FROM " + tableName)) {
                        cr2.next();
                        t.put("rowCount", cr2.getLong(1));
                    } catch (SQLException e2) {
                        t.put("rowCount", 0L);
                    }
                }
                tables.add(t);
            }
            return ResponseEntity.ok(ApiResponse.success(tables, "Tables retrieved successfully"));
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to retrieve tables: " + e.getMessage()));
        }
    }

    // ── DB Stats ─────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stats.put("users",       queryCount(stmt, "SELECT COUNT(*) FROM users"));
            stats.put("courses",     queryCount(stmt, "SELECT COUNT(*) FROM courses"));
            stats.put("lessons",     queryCount(stmt, "SELECT COUNT(*) FROM lessons"));
            stats.put("enrollments", queryCount(stmt, "SELECT COUNT(*) FROM enrollments"));
            stats.put("students",    queryCount(stmt, "SELECT COUNT(*) FROM users WHERE role='STUDENT'"));
            stats.put("instructors", queryCount(stmt, "SELECT COUNT(*) FROM users WHERE role='INSTRUCTOR'"));
            return ResponseEntity.ok(ApiResponse.success(stats, "Database stats retrieved successfully"));
        } catch (SQLException e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to retrieve database stats: " + e.getMessage()));
        }
    }

    private long queryCount(Statement stmt, String sql) throws SQLException {
        ResultSet rs = stmt.executeQuery(sql);
        rs.next();
        return rs.getLong(1);
    }
}
