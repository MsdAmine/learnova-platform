package com.learnova.learnova_backend.course;

import com.learnova.learnova_backend.course.config.CategorySeeder;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers {@link CategorySeeder}: default categories must be present after
 * app startup, re-running the seeder must not create duplicates, and the
 * public catalog endpoint must expose them.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CategorySeederTest {

    private static final String[] DEFAULT_CATEGORY_NAMES = {
            "Software Development",
            "Data Analytics",
            "Project Management",
            "Leadership",
            "Communication",
            "Business Strategy",
            "Cybersecurity",
            "Cloud & DevOps",
            "Design & Product",
            "Marketing"
    };

    @Autowired private MockMvc mockMvc;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CategorySeeder categorySeeder;

    @Test
    void defaultCategoriesExistAfterStartup() {
        for (String name : DEFAULT_CATEGORY_NAMES) {
            assertThat(categoryRepository.existsByNameIgnoreCase(name)).isTrue();
        }
    }

    @Test
    void reRunningSeederDoesNotCreateDuplicates() {
        long countBefore = categoryRepository.count();

        categorySeeder.run();
        categorySeeder.run();

        assertThat(categoryRepository.count()).isEqualTo(countBefore);
    }

    @Test
    void publicCategoriesEndpointExposesDefaultCategories() throws Exception {
        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == 'Software Development')]").exists())
                .andExpect(jsonPath("$[?(@.name == 'Cybersecurity')]").exists());
    }
}
