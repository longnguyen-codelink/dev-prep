namespace FinanceTracker.Controllers;

using System.Security.Claims;
using AutoMapper;
using FinanceTracker.Interfaces;
using FinanceTracker.Models;
using FinanceTracker.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("[controller]")]
[Authorize]
public class TransactionController(
    ILogger<TransactionController> logger,
    TransactionProvider transactionProvider,
    IMapper mapper
) : ControllerBase
{
    private readonly ILogger<TransactionController> _logger = logger;
    private readonly TransactionProvider _transactionProvider = transactionProvider;
    private readonly IMapper _mapper = mapper;

    [HttpGet(Name = "GetTransactions")]
    public async Task<IActionResult> Get([FromQuery] Common.QueryParams queryParams)
    {
        var transactions = await _transactionProvider.GetTransactions(queryParams);
        return Ok(transactions);
    }

    [HttpPost(Name = "CreateTransaction")]
    public async Task<IActionResult> CreateTransaction(
        [FromBody] TransactionMutationDTO transactionDTO
    )
    {
        Common.MutationInitiator mutationInitiator = Common.MutationInitiator.WithJWTClaims(
            HttpContext.User.Identity as ClaimsIdentity
        );
        var createdTransaction = await _transactionProvider.CreateTransaction(
            transactionDTO,
            mutationInitiator
        );
        return CreatedAtRoute(
            "CreateTransaction",
            new { id = createdTransaction.Id },
            createdTransaction
        );
    }

    [HttpGet("summary", Name = "GetTransactionSummary")]
    public async Task<IActionResult> Summary([FromQuery] Guid categoryId)
    {
        var summary = await _transactionProvider.GetSummary(categoryId);
        return Ok(summary);
    }
}
