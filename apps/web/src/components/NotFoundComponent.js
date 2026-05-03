import { Component } from "../core/Component.js";
import { createPageLayout } from "../core/PageLayout.js";
import { createButton } from "@workspace/ui/components/Button";
import { Icons } from "@workspace/ui/components/Icons";

export class NotFoundComponent extends Component {
  render() {
    const { wrapper, container } = createPageLayout({
      title: "", // Remove title to let the 404 stand out
      router: this.props.router,
      pageClass: "not-found-page",
    });

    const content = document.createElement("div");
    content.className = "not-found-card";
    content.innerHTML = `
      <div class="not-found-glitch" data-text="404">404</div>
      <div class="not-found-body">
        <h2>Lost in Space?</h2>
        <p>The page you're looking for has drifted away or never existed in this galaxy.</p>
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "not-found-actions";

    const backBtn = createButton({
      id: "back-to-home",
      label: "Return to Projects",
      variant: "primary",
      size: "lg",
      icon: Icons.home || Icons.arrowLeft,
    });

    backBtn.addEventListener("click", () => {
      if (this.props.router) {
        this.props.router.navigate("/");
      }
    });

    actions.appendChild(backBtn);
    content.appendChild(actions);

    container.innerHTML = ""; // Clear any default content
    container.appendChild(content);
    wrapper.appendChild(container);

    return wrapper;
  }
}
