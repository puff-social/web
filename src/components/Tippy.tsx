import TippyReact, { TippyProps } from "@tippyjs/react";

interface CustomProps {
  extraClass?: string;
}

export function Tippy(props: TippyProps & CustomProps) {
  return (
    <TippyReact
      duration={175}
      arrow
      {...props}
      theme="custom"
      className={`${
        typeof props.content == "string" ? "tippy-box-tip" : "tippy-box-none"
      } ${props.extraClass}`}
      content={
        typeof props.content == "string" ? (
          <span>{props.content}</span>
        ) : (
          props.content
        )
      }
    >
      {props.children}
    </TippyReact>
  );
}
