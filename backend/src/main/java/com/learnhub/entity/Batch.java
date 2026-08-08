package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.util.Set;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "batches")
@SQLDelete(sql = "UPDATE batches SET deleted_at = CURRENT_TIMESTAMP WHERE id=?")
@SQLRestriction("deleted_at IS NULL")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Batch extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String level;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "batch_instructors",
        joinColumns = @JoinColumn(name = "batch_id"),
        inverseJoinColumns = @JoinColumn(name = "instructor_id")
    )
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Set<User> instructors;

    @OneToMany(mappedBy = "batch", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<User> students;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "batch_subjects", joinColumns = @JoinColumn(name = "batch_id"))
    @Column(name = "subject_name")
    private Set<String> subjects;
}
