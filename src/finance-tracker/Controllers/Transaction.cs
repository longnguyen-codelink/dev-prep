namespace FinanceTracker.Controllers;

using AutoMapper;
using FinanceTracker.Models;
using FinanceTracker.Providers;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("[controller]")]
public class TransactionController(
    ILogger<TransactionController> logger,
    TransactionProvider transactionProvider,
    IMapper mapper
) : ControllerBase
{
    private readonly ILogger<TransactionController> _logger = logger;
    private readonly TransactionProvider _transactionProvider = transactionProvider;
    private readonly IMapper _mapper = mapper;
}
