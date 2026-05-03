package com.learnova.learnova_backend.user.entity;

import jakarta.persistence.*;
import lombok.*;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_users_email", columnNames = "email")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false, length = 180)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false, length = 30)
    @Builder.Default
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(
                    name = "user_id",
                    nullable = false,
                    foreignKey = @ForeignKey(name = "fk_user_roles_user")
            ),
            inverseJoinColumns = @JoinColumn(
                    name = "role_id",
                    nullable = false,
                    foreignKey = @ForeignKey(name = "fk_user_roles_role")
            ),
            uniqueConstraints = {
                    @UniqueConstraint(
                            name = "uk_user_roles_user_role",
                            columnNames = {"user_id", "role_id"}
                    )
            }
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;

        if (this.accountStatus == null) {
            this.accountStatus = AccountStatus.ACTIVE;
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void addRole(Role role) {
        this.roles.add(role);
        role.getUsers().add(this);
    }

    public void removeRole(Role role) {
        this.roles.remove(role);
        role.getUsers().remove(this);
    }

    @OneToOne(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private LearnerProfile learnerProfile;

    public void attachLearnerProfile(LearnerProfile learnerProfile) {
        this.learnerProfile = learnerProfile;
        learnerProfile.setUser(this);
    }

    @OneToOne(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private InstructorProfile instructorProfile;

    public void attachInstructorProfile(InstructorProfile instructorProfile) {
        this.instructorProfile = instructorProfile;
        instructorProfile.setUser(this);
    }
}