using AutoMapper;
using FinanceTracker.Models;
using FinanceTracker.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace FinanceTracker.Tests.Services;

public class MappingProfileTests
{
    private readonly IMapper _mapper;

    public MappingProfileTests()
    {
        var config = new MapperConfiguration(
            cfg => cfg.AddProfile<MappingProfile>(),
            NullLoggerFactory.Instance
        );
        _mapper = config.CreateMapper();
    }

    [Fact]
    public void MappingProfile_CanMap_CategoryMutationDTO_ToCategory()
    {
        // Verify the profile registers without errors and produces a usable mapper
        var config = new MapperConfiguration(
            cfg => cfg.AddProfile<MappingProfile>(),
            NullLoggerFactory.Instance
        );
        var mapper = config.CreateMapper();
        var dto = new CategoryMutationDTO { Name = "Test" };

        // Should not throw
        var result = mapper.Map<Category>(dto);
        Assert.Equal("Test", result.Name);
    }

    [Fact]
    public void CategoryMutationDTO_MapsTo_Category_Correctly()
    {
        var dto = new CategoryMutationDTO { Name = "Groceries" };

        var category = _mapper.Map<Category>(dto);

        Assert.Equal("Groceries", category.Name);
    }

    [Fact]
    public void Category_MapsTo_CategoryListDTO_Correctly()
    {
        var id = Guid.NewGuid();
        var category = new Category
        {
            Id = id,
            Name = "Transport",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = Guid.NewGuid(),
        };

        var dto = _mapper.Map<CategoryListDTO>(category);

        Assert.Equal(id, dto.Id);
        Assert.Equal("Transport", dto.Name);
    }

    [Fact]
    public void CategoryMutationDTO_MapsTo_Category_PreservesNameChange()
    {
        var source = new CategoryMutationDTO { Name = "Updated Name" };
        var destination = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Original Name",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = Guid.NewGuid(),
        };

        _mapper.Map(source, destination);

        Assert.Equal("Updated Name", destination.Name);
    }
}
