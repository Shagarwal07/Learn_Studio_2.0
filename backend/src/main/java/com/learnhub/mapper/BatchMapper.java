package com.learnhub.mapper;

import com.learnhub.dto.BatchDTO;
import com.learnhub.dto.BatchDetailsDTO;
import com.learnhub.dto.UserDTO;
import com.learnhub.entity.Batch;
import com.learnhub.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface BatchMapper {

    @Mapping(target = "instructorId", source = "instructor.id")
    @Mapping(target = "instructorName", source = "instructor.name")
    @Mapping(target = "studentCount", expression = "java(batch.getStudents() != null ? batch.getStudents().size() : 0)")
    BatchDTO toDTO(Batch batch);

    @Mapping(target = "instructor", source = "instructor", qualifiedByName = "userToDTO")
    @Mapping(target = "students", source = "students", qualifiedByName = "userToDTO")
    BatchDetailsDTO toDetailsDTO(Batch batch);

    @Named("userToDTO")
    default UserDTO userToDTO(User user) {
        if (user == null) {
            return null;
        }
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
