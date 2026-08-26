using System.Text;

namespace MonitoringETL.Api.Exports;

public static class ExcelCsv
{
    private static readonly UTF8Encoding Utf8WithBom = new(encoderShouldEmitUTF8Identifier: true);

    public static byte[] Create(IEnumerable<IEnumerable<string?>> rows)
    {
        var csv = new StringBuilder();
        foreach (var row in rows)
        {
            csv.AppendJoin(';', row.Select(Escape));
            csv.Append("\r\n");
        }
        var preamble = Utf8WithBom.GetPreamble();
        var payload = Utf8WithBom.GetBytes(csv.ToString());
        var output = new byte[preamble.Length + payload.Length];
        Buffer.BlockCopy(preamble, 0, output, 0, preamble.Length);
        Buffer.BlockCopy(payload, 0, output, preamble.Length, payload.Length);
        return output;
    }

    public static string Escape(string? value)
    {
        var text = value ?? string.Empty;
        return text.IndexOfAny([';', '"', '\r', '\n']) >= 0 ? $"\"{text.Replace("\"", "\"\"")}\"" : text;
    }
}
