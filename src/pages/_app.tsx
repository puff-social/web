import toast, { Toaster } from "react-hot-toast";
import "../assets/app.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Toaster />
      <Component {...pageProps} />
    </>
  );
}
