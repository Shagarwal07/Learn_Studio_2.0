package com.learnhub.mapper;

import com.learnhub.dto.UserDTO;
import com.learnhub.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "batchId", source = "batch.id")
    @Mapping(target = "batchName", source = "batch.name")
    @Mapping(target = "deletedAt", expression = "java(user.getDeletedAt() != null ? user.getDeletedAt().toString() : null)")
    UserDTO toDTO(User user);

    @Mapping(target = "batch", ignore = true)
    @Mapping(target = "enrollments", ignore = true)
    @Mapping(target = "identityProfiles", ignore = true)
    User toEntity(UserDTO userDTO);
}
