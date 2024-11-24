import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("my-element")
export class MyElement extends LitElement {
    @state() name = "my-element";

    override render() {
        return html`<p>Hello world! From ${this.name}</p>`;
    }
}