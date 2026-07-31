import { TestApp } from "../TestApp";
import { homeMetadata, homeSchema, requestBaseUrl } from "../site";

export const generateMetadata = () => homeMetadata("en");

export default async function Home() {
  const schema = homeSchema("en", await requestBaseUrl());
  return (
    <>
      <TestApp locale="en" />
      {schema.map((item, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />)}
    </>
  );
}
