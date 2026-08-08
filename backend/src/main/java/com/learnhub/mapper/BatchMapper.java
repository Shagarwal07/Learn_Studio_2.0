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

    @Mapping(target = "instructorIds", expression = "java(batch.getInstructors() != null ? batch.getInstructors().stream().map(com.learnhub.entity.User::getId).toList() : java.util.Collections.emptyList())")
    @Mapping(target = "instructors", source = "instructors", qualifiedByName = "userToDTOList")
    @Mapping(target = "studentCount", expression = "java(batch.getStudents() != null ? batch.getStudents().size() : 0)")
    BatchDTO toDTO(Batch batch);

    @Mapping(target = "instructorIds", expression = "java(batch.getInstructors() != null ? batch.getInstructors().stream().map(com.learnhub.entity.User::getId).toList() : java.util.Collections.emptyList())")
    @Mapping(target = "instructors", source = "batch.instructors", qualifiedByName = "userToDTOList")
    @Mapping(target = "studentCount", source = "studentCount")
    BatchDTO toDTOWithCount(Batch batch, int studentCount);

    @Mapping(target = "instructors", source = "instructors", qualifiedByName = "userToDTOList")
    @Mapping(target = "students", source = "students", qualifiedByName = "userToDTOList")
    BatchDetailsDTO toDetailsDTO(Batch batch);

    @Named("userToDTOList")
    default java.util.List<UserDTO> userToDTOList(java.util.Collection<User> users) {
        if (users == null) return null;
        return users.stream().map(this::userToDTO).toList();
    }


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
                .batchId(user.getBatch() != null ? user.getBatch().getId() : null)
                .batchName(user.getBatch() != null ? user.getBatch().getName() : null)
                .build();
    }
}
