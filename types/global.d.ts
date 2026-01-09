declare module "../node_modules/bcrypt";

// CSS Module declarations
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.scss" {
  const content: { [className: string]: string };
  export default content;
}

// Side-effect imports for global CSS
declare module "react-toastify/dist/ReactToastify.css";
declare module "../app/globals.css";
declare module "*/globals.css";
declare module "*/globals.scss";
