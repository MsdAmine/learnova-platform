package com.learnova.learnova_backend.media;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.course.entity.Category;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseLevel;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.user.entity.Role;
import com.learnova.learnova_backend.user.entity.RoleName;
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.repository.RoleRepository;
import com.learnova.learnova_backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers the Cloudinary-backed upload endpoints:
 *   POST /api/v1/learner-profile/me/image
 *   POST /api/v1/instructor/courses/{courseId}/thumbnail
 *
 * MediaStorageService is mocked — these tests never call the real Cloudinary API.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MediaUploadIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;

    @MockitoBean private MediaStorageService mediaStorageService;

    @BeforeEach
    void resetMock() {
        Mockito.reset(mediaStorageService);
    }

    private static MockMultipartFile validJpg() {
        return new MockMultipartFile("file", "avatar.jpg", "image/jpeg", new byte[]{1, 2, 3, 4});
    }

    // ─── Profile image upload ───────────────────────────────────────────────────

    @Test
    void uploadProfileImageRejectsUnauthenticated() throws Exception {
        mockMvc.perform(multipart("/api/v1/learner-profile/me/image")
                        .file(validJpg()))
                .andExpect(status().isUnauthorized());

        verify(mediaStorageService, never()).uploadImage(any(), any(), any());
    }

    @Test
    void learnerCanUploadOwnProfileImage() throws Exception {
        when(mediaStorageService.uploadImage(any(), eq(MediaFolder.PROFILE_IMAGES), any()))
                .thenReturn(new MediaUploadResult("https://res.cloudinary.com/demo/avatar.jpg", "learnova/profile-images/learner-1"));

        String token = registerAndLogin("learner.upload1@media.test", "password123");

        mockMvc.perform(multipart("/api/v1/learner-profile/me/image")
                        .file(validJpg())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileImageUrl").value("https://res.cloudinary.com/demo/avatar.jpg"));

        verify(mediaStorageService, times(1)).uploadImage(any(), eq(MediaFolder.PROFILE_IMAGES), any());
    }

    @Test
    void replacingProfileImageDeletesOldPublicId() throws Exception {
        when(mediaStorageService.uploadImage(any(), eq(MediaFolder.PROFILE_IMAGES), any()))
                .thenReturn(new MediaUploadResult("https://res.cloudinary.com/demo/first.jpg", "old-public-id"))
                .thenReturn(new MediaUploadResult("https://res.cloudinary.com/demo/second.jpg", "new-public-id"));

        String token = registerAndLogin("learner.upload2@media.test", "password123");

        mockMvc.perform(multipart("/api/v1/learner-profile/me/image")
                        .file(validJpg())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(multipart("/api/v1/learner-profile/me/image")
                        .file(validJpg())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        verify(mediaStorageService, times(1)).delete(eq("old-public-id"));
    }

    @Test
    void uploadProfileImageRejectsInvalidMimeType() throws Exception {
        String token = registerAndLogin("learner.upload3@media.test", "password123");

        MockMultipartFile pdf = new MockMultipartFile("file", "doc.pdf", "application/pdf", new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/api/v1/learner-profile/me/image")
                        .file(pdf)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        verify(mediaStorageService, never()).uploadImage(any(), any(), any());
    }

    @Test
    void uploadProfileImageRejectsOversizedFile() throws Exception {
        String token = registerAndLogin("learner.upload4@media.test", "password123");

        byte[] oversized = new byte[(2 * 1024 * 1024) + 1];
        MockMultipartFile bigFile = new MockMultipartFile("file", "big.jpg", "image/jpeg", oversized);

        mockMvc.perform(multipart("/api/v1/learner-profile/me/image")
                        .file(bigFile)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        verify(mediaStorageService, never()).uploadImage(any(), any(), any());
    }

    @Test
    void uploadProfileImageRejectsEmptyFile() throws Exception {
        String token = registerAndLogin("learner.upload5@media.test", "password123");

        MockMultipartFile empty = new MockMultipartFile("file", "empty.jpg", "image/jpeg", new byte[0]);

        mockMvc.perform(multipart("/api/v1/learner-profile/me/image")
                        .file(empty)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        verify(mediaStorageService, never()).uploadImage(any(), any(), any());
    }

    // ─── Course thumbnail upload ────────────────────────────────────────────────

    @Test
    void instructorCanUploadOwnCourseThumbnail() throws Exception {
        when(mediaStorageService.uploadImage(any(), eq(MediaFolder.COURSE_THUMBNAILS), any()))
                .thenReturn(new MediaUploadResult("https://res.cloudinary.com/demo/thumb.jpg", "learnova/course-thumbnails/course-1"));

        InstructorContext ctx = setupInstructor("inst.upload1@media.test");
        Long courseId = createCourse(ctx.profile);

        mockMvc.perform(multipart("/api/v1/instructor/courses/{courseId}/thumbnail", courseId)
                        .file(validJpg())
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.thumbnailUrl").value("https://res.cloudinary.com/demo/thumb.jpg"));

        verify(mediaStorageService, times(1)).uploadImage(any(), eq(MediaFolder.COURSE_THUMBNAILS), any());
    }

    @Test
    void instructorCannotUploadThumbnailForAnotherInstructorsCourse() throws Exception {
        InstructorContext owner = setupInstructor("inst.owner.media@media.test");
        InstructorContext other = setupInstructor("inst.other.media@media.test");
        Long courseId = createCourse(owner.profile);

        mockMvc.perform(multipart("/api/v1/instructor/courses/{courseId}/thumbnail", courseId)
                        .file(validJpg())
                        .header("Authorization", "Bearer " + other.token))
                .andExpect(status().isForbidden());

        verify(mediaStorageService, never()).uploadImage(any(), any(), any());
    }

    @Test
    void uploadThumbnailRejectsUnauthenticated() throws Exception {
        InstructorContext ctx = setupInstructor("inst.unauth.media@media.test");
        Long courseId = createCourse(ctx.profile);

        mockMvc.perform(multipart("/api/v1/instructor/courses/{courseId}/thumbnail", courseId)
                        .file(validJpg()))
                .andExpect(status().isUnauthorized());

        verify(mediaStorageService, never()).uploadImage(any(), any(), any());
    }

    @Test
    void uploadThumbnailRejectsOversizedFile() throws Exception {
        InstructorContext ctx = setupInstructor("inst.oversize.media@media.test");
        Long courseId = createCourse(ctx.profile);

        byte[] oversized = new byte[(5 * 1024 * 1024) + 1];
        MockMultipartFile bigFile = new MockMultipartFile("file", "big.png", "image/png", oversized);

        mockMvc.perform(multipart("/api/v1/instructor/courses/{courseId}/thumbnail", courseId)
                        .file(bigFile)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isBadRequest());

        verify(mediaStorageService, never()).uploadImage(any(), any(), any());
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private record InstructorContext(InstructorProfile profile, String token) {}

    private InstructorContext setupInstructor(String email) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Test Instructor", email, "password123"))))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();

        Role instructorRole = roleRepository.findByName(RoleName.ROLE_INSTRUCTOR)
                .orElseGet(() -> roleRepository.save(
                        Role.builder().name(RoleName.ROLE_INSTRUCTOR).build()));
        user.addRole(instructorRole);
        userRepository.save(user);

        InstructorProfile profile = instructorProfileRepository.save(
                InstructorProfile.builder()
                        .user(user)
                        .bio("Test bio")
                        .expertise("Test expertise")
                        .approvalStatus(InstructorApprovalStatus.APPROVED)
                        .build());

        String token = login(email, "password123");
        return new InstructorContext(profile, token);
    }

    private Long createCourse(InstructorProfile profile) {
        Category category = categoryRepository.save(
                Category.builder()
                        .name("Media Test – " + profile.getUser().getEmail())
                        .build());

        Course course = courseRepository.save(
                Course.builder()
                        .title("Media Test Course – " + profile.getUser().getEmail())
                        .instructorProfile(profile)
                        .category(category)
                        .level(CourseLevel.BEGINNER)
                        .status(CourseStatus.DRAFT)
                        .build());

        return course.getId();
    }

    private String registerAndLogin(String email, String password) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Test User", email, password))))
                .andExpect(status().isCreated());
        return login(email, password);
    }

    private String login(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        return json.get("accessToken").asText();
    }
}
