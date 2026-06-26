package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "batches")
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id")
    private User instructor;

    @OneToMany(mappedBy = "batch", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<User> students;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "batch_subjects", joinColumns = @JoinColumn(name = "batch_id"))
    @Column(name = "subject_name")
    private Set<String> subjects;
}
