import { render } from "react-email";
import { describe, expect, it } from "vitest";
import ContactEmailTemplate from "./Contact";

describe("ContactEmailTemplate", () => {
  it("renders the sender's name and message as escaped HTML", async () => {
    const html = await render(<ContactEmailTemplate name="Ada <script>" message="Hello & welcome" />);
    expect(html).toContain("New Contact Form Submission");
    expect(html).toContain("Ada &lt;script&gt;");
    expect(html).toContain("Hello &amp; welcome");
    expect(html).not.toContain("<script>");
  });
});
