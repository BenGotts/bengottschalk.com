import { render } from "react-email";
import { describe, expect, it } from "vitest";
import ContactEmailTemplate from "./Contact";

describe("ContactEmailTemplate", () => {
  it("renders the sender's name and message as escaped HTML", async () => {
    const html = await render(<ContactEmailTemplate name="Ada <script>" email="ada@example.com" message="Hello & welcome" />);
    expect(html).toContain("New message from");
    expect(html).toContain("Ada &lt;script&gt;");
    expect(html).toContain("Hello &amp; welcome");
    expect(html).not.toContain("<script>");
  });

  it("shows the topic, keeps line breaks, and offers a reply button", async () => {
    const html = await render(
      <ContactEmailTemplate name="Ada Lovelace" email="ada@example.com" topic="Software" message={"Line one\nLine two"} />,
    );
    expect(html).toContain("Software");
    expect(html).toMatch(/Line one(<!-- -->)?<br\/?>(<!-- -->)?Line two/);
    expect(html).toContain('href="mailto:ada@example.com?subject=Re%3A%20Software"');
    expect(html).toContain("Reply to <!-- -->Ada");
  });
});
