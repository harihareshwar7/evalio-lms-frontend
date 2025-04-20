import { forwardRef } from "react";
import { motion } from "framer-motion";

const Button = forwardRef(({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  className = "",
  as: Component = "button", // Default to "button", but can be overridden (e.g., Link)
  onClick,
  ...props
}, ref) => {
  // Define variant styles
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white",
    secondary: "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white",
    success: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white",
    danger: "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white",
    ghost: "bg-transparent hover:bg-gray-800/50 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600"
  };

  // Define size styles
  const sizes = {
    sm: "py-1.5 px-3 text-sm",
    md: "py-2.5 px-4",
    lg: "py-3 px-6 text-lg"
  };

  // Combined classes
  const buttonClasses = `
    ${variants[variant]}
    ${sizes[size]}
    rounded-lg font-medium transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-opacity-50
    flex items-center justify-center
    ${disabled || isLoading ? "opacity-70 cursor-not-allowed" : ""}
    ${className}
  `;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
    >
      <Component
        ref={ref}
        className={buttonClasses}
        onClick={onClick}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </Component>
    </motion.div>
  );
});

Button.displayName = "Button";

export default Button;
