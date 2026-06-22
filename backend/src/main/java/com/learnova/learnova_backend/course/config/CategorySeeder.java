package com.learnova.learnova_backend.course.config;

import com.learnova.learnova_backend.course.entity.Category;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Seeds a default set of course categories so the catalog, onboarding, and
 * learning-preferences UIs always have selectable categories on a fresh
 * database. Ordered before DemoUserSeeder (@Order(2)) in case future demo
 * course seeding depends on categories existing.
 */
@Component
@RequiredArgsConstructor
@Order(0)
public class CategorySeeder implements CommandLineRunner {

    private static final Map<String, String> DEFAULT_CATEGORIES = Map.ofEntries(
            Map.entry("Software Development", "Programming languages, frameworks, and software engineering practices."),
            Map.entry("Data Analytics", "Data analysis, visualization, and data-driven decision making."),
            Map.entry("Project Management", "Planning, execution, and delivery of projects across methodologies."),
            Map.entry("Leadership", "Leading teams, organizations, and driving change."),
            Map.entry("Communication", "Written, verbal, and interpersonal communication skills."),
            Map.entry("Business Strategy", "Strategic planning, business models, and competitive analysis."),
            Map.entry("Cybersecurity", "Securing systems, networks, and data against threats."),
            Map.entry("Cloud & DevOps", "Cloud infrastructure, CI/CD, and operational practices."),
            Map.entry("Design & Product", "User experience, product design, and product management."),
            Map.entry("Marketing", "Digital marketing, branding, and growth strategies.")
    );

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        for (Map.Entry<String, String> entry : DEFAULT_CATEGORIES.entrySet()) {
            if (!categoryRepository.existsByNameIgnoreCase(entry.getKey())) {
                categoryRepository.save(
                        Category.builder()
                                .name(entry.getKey())
                                .description(entry.getValue())
                                .build()
                );
            }
        }
    }
}
