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

    [HttpPost(Name = "CreateTransaction")]
    public async Task<IActionResult> CreateTransaction(
        [FromBody] TransactionMutationDTO transactionDTO
    )
    {
        var createdTransaction = await _transactionProvider.CreateTransaction(transactionDTO);
        return CreatedAtRoute(
            "GetTransactionById",
            new { id = createdTransaction.Id },
            createdTransaction
        );
    }

    [HttpGet("summary", Name = "GetTransactionSummary")]
    public async Task<IActionResult> Summary()
    {
        var summary = await _transactionProvider.GetSummary();
        return Ok(summary);
    }
}
