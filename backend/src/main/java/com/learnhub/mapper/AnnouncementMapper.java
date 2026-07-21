package com.learnhub.mapper;

import com.learnhub.dto.AnnouncementDTO;
import com.learnhub.entity.Announcement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AnnouncementMapper {
    
    @Mapping(target = "courseId", source = "course.id")
    @Mapping(target = "courseTitle", source = "course.title")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", source = "createdBy.name")
    @Mapping(target = "batchId", source = "batch.id")
    @Mapping(target = "batchName", source = "batch.name")
    AnnouncementDTO toDTO(Announcement announcement);
}
