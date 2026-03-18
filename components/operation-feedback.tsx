type OperationFeedbackProps = {
  tone: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
};

export function OperationFeedback({ tone, title, message }: OperationFeedbackProps) {
  const classes = getToneClasses(tone);

  return (
    <div className={`rounded-[28px] px-5 py-4 text-sm ${classes.wrapper}`}>
      {title ? <p className={`font-semibold ${classes.title}`}>{title}</p> : null}
      <p className={title ? `mt-1 ${classes.message}` : classes.message}>{message}</p>
    </div>
  );
}

function getToneClasses(tone: OperationFeedbackProps["tone"]) {
  if (tone === "success") {
    return {
      wrapper: "bg-brand-success/10",
      title: "text-brand-success",
      message: "text-brand-success"
    };
  }

  if (tone === "warning") {
    return {
      wrapper: "bg-brand-attention/10",
      title: "text-brand-attention",
      message: "text-brand-attention"
    };
  }

  if (tone === "error") {
    return {
      wrapper: "bg-brand-danger/10",
      title: "text-brand-danger",
      message: "text-brand-danger"
    };
  }

  return {
    wrapper: "bg-brand-blue/10",
    title: "text-brand-blue",
    message: "text-brand-blue"
  };
}
