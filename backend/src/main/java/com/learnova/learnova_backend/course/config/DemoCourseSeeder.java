package com.learnova.learnova_backend.course.config;

import com.learnova.learnova_backend.course.entity.Category;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseLevel;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.entity.Lesson;
import com.learnova.learnova_backend.course.entity.Section;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.course.repository.LessonRepository;
import com.learnova.learnova_backend.course.repository.SectionRepository;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Seeds a realistic-looking demo course catalog so the public catalog, course
 * detail pages, and instructor course views are populated for local dev and
 * PFA demo/screenshot purposes. Runs after CategorySeeder (@Order(0)),
 * RoleSeeder (@Order(1)), and DemoUserSeeder (@Order(2)) so categories and the
 * approved demo instructor accounts already exist.
 *
 * Thumbnail images are direct, stable Unsplash photo URLs (images.unsplash.com/photo-&lt;id&gt;),
 * not the rotating source.unsplash.com/random endpoint, so they don't change between runs.
 */
@Component
@RequiredArgsConstructor
@Order(3)
public class DemoCourseSeeder implements CommandLineRunner {

    private static final String UNSPLASH_PARAMS = "?w=1200&h=675&fit=crop&q=80";

    private record LessonSeed(String title) {
    }

    private record SectionSeed(String title, List<LessonSeed> lessons) {
    }

    private record CourseSeed(
            String title,
            String description,
            CourseLevel level,
            CourseStatus status,
            String categoryName,
            String instructorEmail,
            String thumbnailUrl,
            List<SectionSeed> sections) {
    }

    private static SectionSeed section(String title, String... lessonTitles) {
        return new SectionSeed(title, List.of(lessonTitles).stream().map(LessonSeed::new).toList());
    }

    private static String unsplash(String photoId) {
        return "https://images.unsplash.com/" + photoId + UNSPLASH_PARAMS;
    }

    private static final String INSTRUCTOR_SOFTWARE = "demo.instructor@learnova.dev";
    private static final String INSTRUCTOR_DATA = "demo.instructor2@learnova.dev";
    private static final String INSTRUCTOR_MANAGEMENT = "demo.instructor3@learnova.dev";
    private static final String INSTRUCTOR_PRODUCT = "demo.instructor4@learnova.dev";

    private final List<CourseSeed> courseSeeds = List.of(
            // --- Software Development (instructor: Software/Cloud) ---
            new CourseSeed(
                    "Building REST APIs with Spring Boot",
                    "Learn to design and build production-ready REST APIs using Spring Boot, covering routing, request validation, error handling, and persistence with Spring Data JPA.",
                    CourseLevel.INTERMEDIATE, CourseStatus.PUBLISHED,
                    "Software Development", INSTRUCTOR_SOFTWARE,
                    unsplash("photo-1517694712202-14dd9538aa97"),
                    List.of(
                            section("Getting Started with Spring Boot",
                                    "Setting up a Spring Boot project", "Understanding the application structure"),
                            section("Building the API Layer",
                                    "Designing REST endpoints", "Request validation and error handling"),
                            section("Persisting Data",
                                    "Connecting to a database with Spring Data JPA"))),
            new CourseSeed(
                    "React and TypeScript for Professional Dashboards",
                    "Build maintainable dashboard interfaces with React and TypeScript, covering component architecture, type-safe props, and state management patterns.",
                    CourseLevel.INTERMEDIATE, CourseStatus.PUBLISHED,
                    "Software Development", INSTRUCTOR_SOFTWARE,
                    unsplash("photo-1542831371-29b0f74f9713"),
                    List.of(
                            section("React Fundamentals with TypeScript",
                                    "Typing components and props", "Organizing a component library"),
                            section("Managing Application State",
                                    "Local state vs shared state", "Working with context and hooks"),
                            section("Building Dashboard Layouts",
                                    "Composing reusable dashboard widgets"))),
            new CourseSeed(
                    "Clean Architecture for Java Applications",
                    "Apply clean architecture principles to structure Java applications that are easier to test, extend, and maintain over time.",
                    CourseLevel.ADVANCED, CourseStatus.PUBLISHED,
                    "Software Development", INSTRUCTOR_SOFTWARE,
                    unsplash("photo-1607799279861-4dd421887fb3"),
                    List.of(
                            section("Principles of Clean Architecture",
                                    "Separating concerns across layers", "Dependency inversion in practice"),
                            section("Structuring a Java Application",
                                    "Organizing packages by feature", "Isolating business logic from frameworks"))),

            // --- Data Analytics (instructor: Data) ---
            new CourseSeed(
                    "SQL for Business Analytics",
                    "Develop practical SQL skills for querying, joining, and aggregating data to answer common business analytics questions.",
                    CourseLevel.BEGINNER, CourseStatus.PUBLISHED,
                    "Data Analytics", INSTRUCTOR_DATA,
                    unsplash("photo-1551288049-bebda4e38f71"),
                    List.of(
                            section("SQL Query Basics",
                                    "Selecting and filtering data", "Sorting and limiting results"),
                            section("Combining and Aggregating Data",
                                    "Joining multiple tables", "Grouping and aggregate functions"))),
            new CourseSeed(
                    "Python Data Analysis Foundations",
                    "Use Python and pandas to clean, explore, and summarize real-world datasets for analysis.",
                    CourseLevel.BEGINNER, CourseStatus.PUBLISHED,
                    "Data Analytics", INSTRUCTOR_DATA,
                    unsplash("photo-1543286386-713bdd548da4"),
                    List.of(
                            section("Working with Pandas",
                                    "Loading and inspecting data", "Cleaning and transforming data"),
                            section("Exploring and Summarizing Data",
                                    "Descriptive statistics", "Grouping and pivoting data"))),
            new CourseSeed(
                    "Data Visualization for Decision-Making",
                    "Translate data into clear, decision-ready visualizations using established charting principles and common pitfalls to avoid.",
                    CourseLevel.INTERMEDIATE, CourseStatus.PUBLISHED,
                    "Data Analytics", INSTRUCTOR_DATA,
                    unsplash("photo-1504868584819-f8e8b4b6d7e3"),
                    List.of(
                            section("Principles of Effective Visualization",
                                    "Choosing the right chart type", "Common visualization mistakes"),
                            section("Building Visualizations",
                                    "Designing dashboards for stakeholders"))),

            // --- Project Management (instructor: Management) ---
            new CourseSeed(
                    "Agile Project Delivery",
                    "Plan and deliver projects using agile practices, covering iterative planning, backlog management, and team ceremonies.",
                    CourseLevel.BEGINNER, CourseStatus.PUBLISHED,
                    "Project Management", INSTRUCTOR_MANAGEMENT,
                    unsplash("photo-1531545514256-b1400bc00f31"),
                    List.of(
                            section("Agile Foundations",
                                    "Agile values and principles", "Comparing agile frameworks"),
                            section("Running Agile Delivery",
                                    "Backlog management", "Facilitating sprint ceremonies"))),
            new CourseSeed(
                    "Risk Management for Digital Projects",
                    "Identify, assess, and respond to risk in digital project delivery, with practical templates for ongoing risk tracking.",
                    CourseLevel.INTERMEDIATE, CourseStatus.PUBLISHED,
                    "Project Management", INSTRUCTOR_MANAGEMENT,
                    unsplash("photo-1454165804606-c3d57bc86b40"),
                    List.of(
                            section("Identifying Project Risk",
                                    "Sources of risk in digital projects", "Building a risk register"),
                            section("Responding to Risk",
                                    "Mitigation and contingency planning"))),

            // --- Leadership (instructor: Management) ---
            new CourseSeed(
                    "First-Time Manager Essentials",
                    "Build the core skills new managers need to lead a team effectively, from delegation to giving feedback.",
                    CourseLevel.BEGINNER, CourseStatus.PUBLISHED,
                    "Leadership", INSTRUCTOR_MANAGEMENT,
                    unsplash("photo-1521737711867-e3b97375f902"),
                    List.of(
                            section("Transitioning into Management",
                                    "Shifting from individual contributor to manager", "Setting expectations with your team"),
                            section("Core Management Skills",
                                    "Delegating effectively", "Giving constructive feedback"))),
            new CourseSeed(
                    "Leading Hybrid Teams",
                    "Lead distributed and hybrid teams with practices for communication, collaboration, and maintaining team cohesion.",
                    CourseLevel.INTERMEDIATE, CourseStatus.PUBLISHED,
                    "Leadership", INSTRUCTOR_MANAGEMENT,
                    unsplash("photo-1556761175-5973dc0f32e7"),
                    List.of(
                            section("Hybrid Team Dynamics",
                                    "Challenges unique to hybrid teams", "Building trust across locations"),
                            section("Sustaining Collaboration",
                                    "Communication rhythms for hybrid teams"))),

            // --- Communication (instructor: Management) ---
            new CourseSeed(
                    "Business Writing for Professionals",
                    "Write clear, concise business communication for email, reports, and documentation that respects your reader's time.",
                    CourseLevel.BEGINNER, CourseStatus.PUBLISHED,
                    "Communication", INSTRUCTOR_MANAGEMENT,
                    unsplash("photo-1556761175-4b46a572b786"),
                    List.of(
                            section("Foundations of Clear Writing",
                                    "Structuring a message for clarity", "Editing for conciseness"),
                            section("Writing for Different Formats",
                                    "Writing effective emails", "Structuring reports and summaries"))),
            new CourseSeed(
                    "Presentation Skills for Technical Teams",
                    "Present technical work to varied audiences with confidence, structuring talks that balance depth and clarity.",
                    CourseLevel.INTERMEDIATE, CourseStatus.PUBLISHED,
                    "Communication", INSTRUCTOR_MANAGEMENT,
                    unsplash("photo-1517245386807-bb43f82c33c4"),
                    List.of(
                            section("Structuring a Technical Talk",
                                    "Knowing your audience", "Structuring content for clarity"),
                            section("Delivering with Confidence",
                                    "Handling questions and discussion"))),

            // --- Business Strategy (instructor: Data) ---
            new CourseSeed(
                    "Strategic Planning Fundamentals",
                    "Learn frameworks for setting organizational strategy, from environmental analysis to goal setting and execution planning.",
                    CourseLevel.INTERMEDIATE, CourseStatus.PUBLISHED,
                    "Business Strategy", INSTRUCTOR_DATA,
                    unsplash("photo-1507679799987-c73779587ccf"),
                    List.of(
                            section("Analyzing the Strategic Landscape",
                                    "Assessing market and competitive position", "Identifying strategic options"),
                            section("Setting and Executing Strategy",
                                    "Translating strategy into goals"))),
            new CourseSeed(
                    "Finance Basics for Non-Financial Managers",
                    "Understand core financial statements and metrics well enough to participate confidently in budget and investment discussions.",
                    CourseLevel.BEGINNER, CourseStatus.DRAFT,
                    "Business Strategy", INSTRUCTOR_DATA,
                    unsplash("photo-1553877522-43269d4ea984"),
                    List.of()),

            // --- Cybersecurity (instructor: Product) ---
            new CourseSeed(
                    "Cybersecurity Fundamentals for Teams",
                    "Build organization-wide security awareness, covering common threats, safe practices, and incident reporting basics.",
                    CourseLevel.BEGINNER, CourseStatus.PUBLISHED,
                    "Cybersecurity", INSTRUCTOR_PRODUCT,
                    unsplash("photo-1555066931-4365d14bab8c"),
                    List.of(
                            section("Understanding Common Threats",
                                    "Phishing and social engineering", "Password and account hygiene"),
                            section("Building a Security Culture",
                                    "Reporting and responding to incidents"))),
            new CourseSeed(
                    "Web Application Security Basics",
                    "Identify and remediate common web application vulnerabilities, grounded in the OWASP Top 10.",
                    CourseLevel.INTERMEDIATE, CourseStatus.PUBLISHED,
                    "Cybersecurity", INSTRUCTOR_PRODUCT,
                    unsplash("photo-1563013544-824ae1b704d3"),
                    List.of(
                            section("Common Web Vulnerabilities",
                                    "Injection and input validation flaws", "Cross-site scripting and CSRF"),
                            section("Securing Applications",
                                    "Secure coding practices"))),
            new CourseSeed(
                    "Secure Authentication and Access Control",
                    "Design secure authentication and authorization flows, covering session management, token-based auth, and access control models.",
                    CourseLevel.ADVANCED, CourseStatus.DRAFT,
                    "Cybersecurity", INSTRUCTOR_PRODUCT,
                    unsplash("photo-1614064641938-3bbee52942c7"),
                    List.of()),

            // --- Cloud & DevOps (instructor: Software) ---
            new CourseSeed(
                    "CI/CD Foundations",
                    "Set up continuous integration and delivery pipelines that build, test, and deploy code reliably.",
                    CourseLevel.BEGINNER, CourseStatus.PUBLISHED,
                    "Cloud & DevOps", INSTRUCTOR_SOFTWARE,
                    unsplash("photo-1544197150-b99a580bb7a8"),
                    List.of(
                            section("CI/CD Concepts",
                                    "Why continuous integration matters", "Stages of a delivery pipeline"),
                            section("Building a Pipeline",
                                    "Automating builds and tests", "Automating deployment"))),
            new CourseSeed(
                    "Cloud Infrastructure Essentials",
                    "Understand core cloud infrastructure concepts, including compute, storage, and networking fundamentals shared across major providers.",
                    CourseLevel.BEGINNER, CourseStatus.PUBLISHED,
                    "Cloud & DevOps", INSTRUCTOR_SOFTWARE,
                    unsplash("photo-1605745341112-85968b19335b"),
                    List.of(
                            section("Core Cloud Concepts",
                                    "Compute and storage fundamentals", "Networking basics in the cloud"),
                            section("Operating in the Cloud",
                                    "Managing cost and scaling"))),
            new CourseSeed(
                    "Monitoring and Incident Response",
                    "Set up effective monitoring and structure an incident response process that minimizes downtime and recurrence.",
                    CourseLevel.INTERMEDIATE, CourseStatus.DRAFT,
                    "Cloud & DevOps", INSTRUCTOR_SOFTWARE,
                    unsplash("photo-1518770660439-4636190af475"),
                    List.of()),

            // --- Design & Product (instructor: Product) ---
            new CourseSeed(
                    "Product Discovery and User Research",
                    "Run lightweight discovery and research activities to validate product ideas before committing engineering effort.",
                    CourseLevel.BEGINNER, CourseStatus.PUBLISHED,
                    "Design & Product", INSTRUCTOR_PRODUCT,
                    unsplash("photo-1559028012-481c04fa702d"),
                    List.of(
                            section("Discovery Fundamentals",
                                    "Framing problems before solutions", "Choosing the right research method"),
                            section("Running Research",
                                    "Conducting and synthesizing user interviews"))),
            new CourseSeed(
                    "UX Foundations for Web Applications",
                    "Apply core usability and interaction design principles to build web interfaces that are intuitive and accessible.",
                    CourseLevel.BEGINNER, CourseStatus.PUBLISHED,
                    "Design & Product", INSTRUCTOR_PRODUCT,
                    unsplash("photo-1581291518633-83b4ebd1d83e"),
                    List.of(
                            section("Usability Principles",
                                    "Designing for clarity and consistency", "Accessibility basics"),
                            section("Interaction Patterns",
                                    "Common UI patterns for the web"))),

            // --- Marketing (instructor: Product) ---
            new CourseSeed(
                    "Content Strategy for Professional Brands",
                    "Plan content that supports business goals, covering audience research, editorial planning, and measuring impact.",
                    CourseLevel.BEGINNER, CourseStatus.PUBLISHED,
                    "Marketing", INSTRUCTOR_PRODUCT,
                    unsplash("photo-1432888622747-4eb9a8efeb07"),
                    List.of(
                            section("Planning Content Strategy",
                                    "Understanding your audience", "Building an editorial calendar"),
                            section("Measuring Content Performance",
                                    "Tracking content metrics"))),
            new CourseSeed(
                    "SEO Fundamentals for Business Websites",
                    "Improve organic visibility for business websites through practical, sustainable SEO fundamentals.",
                    CourseLevel.BEGINNER, CourseStatus.PUBLISHED,
                    "Marketing", INSTRUCTOR_PRODUCT,
                    unsplash("photo-1460925895917-afdab827c52f"),
                    List.of(
                            section("SEO Basics",
                                    "How search engines rank content", "Keyword research fundamentals"),
                            section("On-Page and Technical SEO",
                                    "Optimizing page content and structure"))));

    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;
    private final InstructorProfileRepository instructorProfileRepository;
    private final UserRepository userRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;

    @Override
    @Transactional
    public void run(String... args) {
        for (CourseSeed seed : courseSeeds) {
            seedCourse(seed);
        }
    }

    private void seedCourse(CourseSeed seed) {
        InstructorProfile instructorProfile = resolveInstructorProfile(seed.instructorEmail());
        if (courseRepository.existsByTitleIgnoreCaseAndInstructorProfileId(seed.title(), instructorProfile.getId())) {
            return;
        }

        Category category = categoryRepository.findByNameIgnoreCase(seed.categoryName())
                .orElseThrow(() -> new IllegalStateException("Category not seeded: " + seed.categoryName()));

        Course course = courseRepository.save(
                Course.builder()
                        .instructorProfile(instructorProfile)
                        .category(category)
                        .title(seed.title())
                        .description(seed.description())
                        .level(seed.level())
                        .status(seed.status())
                        .thumbnailUrl(seed.thumbnailUrl())
                        .build());

        for (SectionSeed sectionSeed : seed.sections()) {
            Section section = sectionRepository.save(
                    Section.builder().title(sectionSeed.title()).course(course).build());

            for (LessonSeed lessonSeed : sectionSeed.lessons()) {
                lessonRepository.save(
                        Lesson.builder().title(lessonSeed.title()).section(section).build());
            }
        }
    }

    private InstructorProfile resolveInstructorProfile(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException("Demo instructor not seeded: " + email));
        return instructorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("Instructor profile missing for: " + email));
    }
}
