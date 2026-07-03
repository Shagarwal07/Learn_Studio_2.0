# Implementation Plan - Fix Attendance Marking and Batch Name Mismatches

We will fix the bulk attendance marking flow on the Admin Attendance dashboard, make the database queries resilient to duplicate records, and normalize batch name lookups in the CSV import flow to resolve formatting errors.

## Proposed Changes

### Database & Repository Layer

#### [MODIFY] [AttendanceRepository.java](file:///d:/JECRC%20BTECH/Repo%20Projects/LearnStudio_final/backend/src/main/java/com/learnhub/repository/AttendanceRepository.java)
- Change the query signature from returning `Optional<Attendance>` to `List<Attendance>` to prevent application crashes (such as `IncorrectResultSizeDataAccessException`) if duplicate attendance logs exist for the same student, subject, and date:
  ```java
  List<Attendance> findByStudentIdAndSubjectNameAndDate(Long studentId, String subjectName, LocalDate date);
  ```

---

### Service Layer

#### [MODIFY] [BatchService.java](file:///d:/JECRC%20BTECH/Repo%20Projects/LearnStudio_final/backend/src/main/java/com/learnhub/service/BatchService.java)
- Update `markBatchAttendance` to use the new `List<Attendance>` return type.
- If existing records are found, update the first record, set its batch, and delete any duplicate records to clean up the database state.

#### [MODIFY] [AttendanceService.java](file:///d:/JECRC%20BTECH/Repo%20Projects/LearnStudio_final/backend/src/main/java/com/learnhub/service/AttendanceService.java)
- Update the single-student `markAttendance` method to automatically populate the `batch` property on the `Attendance` entity using `student.getBatch()`. This ensures that individual attendance markers still map records to the student's batch.

#### [MODIFY] [AdminService.java](file:///d:/JECRC%20BTECH/Repo%20Projects/LearnStudio_final/backend/src/main/java/com/learnhub/service/AdminService.java)
- Add a helper method `findBatchByNormalizedName(String name)` that cleans up whitespaces, trims, and does a case-insensitive check against all batches in the database.
- Update the CSV import flow to resolve batch mappings using this normalized helper, preventing failure exceptions when batch names contain carriage returns or multiple spaces.

---

### Frontend Layer

#### [MODIFY] [AdminAttendanceView.tsx](file:///d:/JECRC%20BTECH/Repo%20Projects/LearnStudio_final/frontend/src/app/dashboard/attendance/AdminAttendanceView.tsx)
- Correct the `markAttendanceMutation` API endpoint. Instead of posting a bulk payload to the single-student endpoint `/instructor/attendance/mark`, post it to `/instructor/batches/${batchId}/attendance`.
- Extract the `batchId` parameter from the mutation payload to construct the dynamic URL, and forward the rest of the payload (`subjectName`, `date`, `records`) to match the backend request requirements.

## Verification Plan

### Automated Tests
- Build and compile the backend with `mvn clean compile` to ensure there are no compilation errors.

### Manual Verification
- Log in as an Administrator/Instructor and navigate to the **Academics & Attendance** panel.
- Choose a batch (e.g. Class VIII) and submit a new attendance roster for a specific date/subject. Verify that the request succeeds and the log updates on screen.
- Import a CSV file with student records containing batch names with extra spaces or lowercase levels (e.g., ` class   viii `) and verify that they are correctly matched and enrolled in the batch.
