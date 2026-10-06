import { unstableSetRender } from "antd";
import { createRoot, type Root } from "react-dom/client";

const roots = new WeakMap<Element | DocumentFragment, Root>();

// Ant Design 5.26's static dialogs/messages use ReactDOM.render by default,
// which React 19 no longer exports. Register the same client renderer as the app.
export function installAntdReact19Renderer() {
  unstableSetRender((node, container) => {
    let root = roots.get(container);
    if (!root) {
      root = createRoot(container);
      roots.set(container, root);
    }
    root.render(node);

    return async () => {
      // Static controls may close during a React render; unmount on the next tick.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      root.unmount();
      roots.delete(container);
    };
  });
}
