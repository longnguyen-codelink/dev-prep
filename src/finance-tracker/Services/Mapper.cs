using AutoMapper;
using FinanceTracker.Models;

namespace FinanceTracker.Services;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Category mappings
        CreateMap<CategoryMutationDTO, Category>();
        CreateMap<Category, CategoryListDTO>();

        // Add more mappings as needed
    }
}
