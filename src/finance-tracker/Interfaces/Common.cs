namespace FinanceTracker.Interfaces;

public class Common
{
    public class QueryParams
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Search { get; set; }
    }

    public class SelectOption
    {
        public string Label { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }

    public interface IMutationInitiator
    {
        Guid MutationId { get; set; }
        Guid UserId { get; set; }
        DateTime Timestamp { get; set; }
    }

    public class MutationInitiator : IMutationInitiator
    {
        public Guid MutationId { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public static MutationInitiator WithJWTClaims(
            System.Security.Claims.ClaimsIdentity? jwtIdentity,
            DateTime? timestamp = null
        )
        {
            MutationInitiator mutationInitiator = new() { };

            if (jwtIdentity == null)
                return mutationInitiator;

            IEnumerable<System.Security.Claims.Claim> claims = jwtIdentity.Claims;
            // or

            var userIdClaim = claims.FirstOrDefault(c => c.Type == "sub");
            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out Guid parsedUserId))
                mutationInitiator.UserId = parsedUserId;

            if (timestamp.HasValue)
                mutationInitiator.Timestamp = timestamp.Value;

            return mutationInitiator;
        }
    }
}
