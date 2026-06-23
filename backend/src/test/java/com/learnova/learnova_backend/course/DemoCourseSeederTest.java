package com.learnova.learnova_backend.course;

import com.learnova.learnova_backend.course.config.DemoCourseSeeder;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.entity.Lesson;
import com.learnova.learnova_backend.course.entity.Section;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.course.repository.LessonRepository;
import com.learnova.learnova_backend.course.repository.SectionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Covers {@link DemoCourseSeeder}: a realistic demo catalog must exist after
 * startup, re-running the seeder must not create duplicate courses, every
 * seeded course must carry a thumbnail, and seeded published courses must
 * have section/lesson structure for the course player/detail pages.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DemoCourseSeederTest {

    @Autowired private CourseRepository courseRepository;
    @Autowired private SectionRepository sectionRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private DemoCourseSeeder demoCourseSeeder;

    @Test
    void seedsAtLeastTwentyCoursesAfterStartup() {
        assertThat(courseRepository.count()).isGreaterThanOrEqualTo(20);
    }

    @Test
    void reRunningSeederDoesNotCreateDuplicates() {
        long countBefore = courseRepository.count();

        demoCourseSeeder.run();
        demoCourseSeeder.run();

        assertThat(courseRepository.count()).isEqualTo(countBefore);
    }

    @Test
    void seededCoursesHaveNonEmptyThumbnailUrls() {
        List<Course> courses = courseRepository.findAll();

        assertThat(courses).isNotEmpty();
        assertThat(courses).allSatisfy(course ->
                assertThat(course.getThumbnailUrl()).isNotBlank());
    }

    @Test
    void seededPublishedCoursesHaveSectionsAndLessons() {
        List<Course> published = courseRepository.findByStatus(CourseStatus.PUBLISHED);

        assertThat(published).isNotEmpty();
        for (Course course : published) {
            List<Section> sections = sectionRepository.findByCourseIdOrderByIdAsc(course.getId());
            assertThat(sections)
                    .as("sections for course '%s'", course.getTitle())
                    .isNotEmpty();

            int lessonCount = sections.stream()
                    .mapToInt(section -> lessonRepository.findBySectionIdOrderByIdAsc(section.getId()).size())
                    .sum();
            assertThat(lessonCount)
                    .as("lessons for course '%s'", course.getTitle())
                    .isGreaterThan(0);
        }
    }

    @Test
    void noDuplicateCourseTitlesAcrossRepeatedRuns() {
        demoCourseSeeder.run();

        List<String> titles = courseRepository.findAll().stream()
                .map(Course::getTitle)
                .map(String::toLowerCase)
                .toList();

        List<String> distinctTitles = titles.stream().distinct().collect(Collectors.toList());

        assertThat(titles).hasSameSizeAs(distinctTitles);
    }
}
