using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Crypto.Signers;
using Org.BouncyCastle.Security;

try
{
    return await RunAsync(args);
}
catch (Exception exception)
{
    await WriteAsync(new { status = "error", error = "adapter_failure", detail = exception.Message });
    return 1;
}

static async Task<int> RunAsync(string[] args)
{
    if (args.Length == 0) return await ErrorAsync("command_required");
    return args[0] switch
    {
        "doctor" => await DoctorAsync(),
        "self-test" => await SelfTestAsync(),
        "sign" => await SignAsync(Arguments.Parse(args[1..])),
        "verify" => await VerifyAsync(Arguments.Parse(args[1..])),
        _ => await ErrorAsync("unknown_command"),
    };
}

static async Task<int> DoctorAsync()
{
    var privateKey = Environment.GetEnvironmentVariable("SCHOLARIUM_BC_ED25519_PRIVATE_KEY_B64");
    var publicKey = Environment.GetEnvironmentVariable("SCHOLARIUM_BC_ED25519_PUBLIC_KEY_B64");
    await WriteAsync(new
    {
        status = "ok",
        schema = "scholarium.bc-adapter-doctor.v1",
        provider = Policy.ProviderVersion,
        private_key_configured = ValidKey(privateKey, 32),
        public_key_configured = ValidKey(publicKey, 32),
        key_storage = "external_secret_or_kms_only",
        local_key_store = false,
        supported_operation = "ed25519_receipt_signatures",
        confidentiality_claim = false,
    });
    return 0;
}

static async Task<int> SelfTestAsync()
{
    var privateKey = new Ed25519PrivateKeyParameters(new SecureRandom());
    var publicKey = privateKey.GeneratePublicKey();
    var context = "self-test";
    var jobId = "job-test";
    var requestDigest = Digest("request");
    var receiptDigest = Digest("receipt");
    var terminalStatus = "completed";
    var message = Encoding.UTF8.GetBytes(CanonicalMessage(context, jobId, requestDigest, receiptDigest, terminalStatus));
    var signer = new Ed25519Signer();
    signer.Init(true, privateKey);
    signer.BlockUpdate(message, 0, message.Length);
    var signature = signer.GenerateSignature();
    var verifier = new Ed25519Signer();
    verifier.Init(false, publicKey);
    verifier.BlockUpdate(message, 0, message.Length);
    var verified = verifier.VerifySignature(signature);
    await WriteAsync(new
    {
        status = verified ? "ok" : "error",
        schema = "scholarium.bc-adapter-self-test.v1",
        provider = Policy.ProviderVersion,
        verified,
        persisted_key_material = false,
        vector = new
        {
            context,
            job_id = jobId,
            request_digest = requestDigest,
            receipt_digest = receiptDigest,
            terminal_status = terminalStatus,
            public_key_b64 = Convert.ToBase64String(publicKey.GetEncoded()),
            signature_b64 = Convert.ToBase64String(signature),
        },
    });
    return verified ? 0 : 1;
}

static async Task<int> SignAsync(Arguments arguments)
{
    if (!TryInputs(arguments, out var values)) return await ErrorAsync("invalid_or_missing_receipt_fields");
    var privateKeyBytes = KeyFromEnvironment("SCHOLARIUM_BC_ED25519_PRIVATE_KEY_B64");
    var privateKey = new Ed25519PrivateKeyParameters(privateKeyBytes, 0);
    var message = Encoding.UTF8.GetBytes(CanonicalMessage(values.Context, values.JobId, values.RequestDigest, values.ReceiptDigest, values.Status));
    var signer = new Ed25519Signer();
    signer.Init(true, privateKey);
    signer.BlockUpdate(message, 0, message.Length);
    var signature = signer.GenerateSignature();
    var publicKey = privateKey.GeneratePublicKey().GetEncoded();
    await WriteAsync(new
    {
        status = "ok",
        schema = Policy.Schema,
        provider = Policy.ProviderVersion,
        algorithm = "Ed25519",
        signature_b64 = Convert.ToBase64String(signature),
        public_key_fingerprint = $"sha256:{Convert.ToHexString(SHA256.HashData(publicKey)).ToLowerInvariant()}",
        signed_payload_digest = Digest(Encoding.UTF8.GetString(message)),
        key_storage = "external_secret_or_kms_only",
    });
    return 0;
}

static async Task<int> VerifyAsync(Arguments arguments)
{
    if (!TryInputs(arguments, out var values) || !arguments.TryGet("--signature-b64", out var signatureB64)) return await ErrorAsync("invalid_or_missing_receipt_fields");
    var publicKeyBytes = KeyFromEnvironment("SCHOLARIUM_BC_ED25519_PUBLIC_KEY_B64");
    var signature = Convert.FromBase64String(signatureB64);
    var message = Encoding.UTF8.GetBytes(CanonicalMessage(values.Context, values.JobId, values.RequestDigest, values.ReceiptDigest, values.Status));
    var verifier = new Ed25519Signer();
    verifier.Init(false, new Ed25519PublicKeyParameters(publicKeyBytes, 0));
    verifier.BlockUpdate(message, 0, message.Length);
    var verified = verifier.VerifySignature(signature);
    await WriteAsync(new { status = "ok", schema = Policy.Schema, provider = Policy.ProviderVersion, algorithm = "Ed25519", verified });
    return verified ? 0 : 2;
}

static bool TryInputs(Arguments arguments, out ReceiptValues values)
{
    values = new ReceiptValues("", "", "", "", "");
    if (!arguments.TryGet("--context", out var context) || !Regex.IsMatch(context, "^[a-z0-9][a-z0-9:._-]{0,119}$") ||
        !arguments.TryGet("--job-id", out var jobId) || !Regex.IsMatch(jobId, "^[A-Za-z0-9][A-Za-z0-9:._-]{0,179}$") ||
        !arguments.TryGet("--request-digest", out var requestDigest) || !IsDigest(requestDigest) ||
        !arguments.TryGet("--receipt-digest", out var receiptDigest) || !IsDigest(receiptDigest) ||
        !arguments.TryGet("--status", out var status) || status is not ("completed" or "failed" or "quarantined")) return false;
    values = new ReceiptValues(context, jobId, requestDigest, receiptDigest, status);
    return true;
}

static string CanonicalMessage(string context, string jobId, string requestDigest, string receiptDigest, string status) =>
    $"{Policy.Schema}|{context}|{jobId}|{requestDigest}|{receiptDigest}|{status}";

static bool IsDigest(string value) => Regex.IsMatch(value, "^sha256:[a-f0-9]{64}$");

static string Digest(string value) => $"sha256:{Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant()}";

static byte[] KeyFromEnvironment(string name)
{
    var value = Environment.GetEnvironmentVariable(name);
    if (!ValidKey(value, 32)) throw new InvalidOperationException($"{name} must be provided by an external secret store as a 32-byte Base64 key.");
    return Convert.FromBase64String(value!);
}

static bool ValidKey(string? value, int expectedBytes)
{
    if (string.IsNullOrWhiteSpace(value)) return false;
    try { return Convert.FromBase64String(value).Length == expectedBytes; }
    catch (FormatException) { return false; }
}

static async Task<int> ErrorAsync(string error)
{
    await WriteAsync(new { status = "error", error });
    return 1;
}

static Task WriteAsync(object value) => Console.Out.WriteLineAsync(JsonSerializer.Serialize(value));

sealed record ReceiptValues(string Context, string JobId, string RequestDigest, string ReceiptDigest, string Status);

static class Policy
{
    public const string Schema = "scholarium.bc-ed25519-receipt.v1";
    public const string ProviderVersion = "BouncyCastle.Cryptography/2.6.2";
}

sealed class Arguments
{
    private readonly Dictionary<string, string> _values = new(StringComparer.Ordinal);

    public static Arguments Parse(IEnumerable<string> source)
    {
        var result = new Arguments();
        string? key = null;
        foreach (var item in source)
        {
            if (item.StartsWith("--", StringComparison.Ordinal)) { key = item; continue; }
            if (key is not null) { result._values[key] = item; key = null; }
        }
        return result;
    }

    public bool TryGet(string key, out string value) => _values.TryGetValue(key, out value!);
}
