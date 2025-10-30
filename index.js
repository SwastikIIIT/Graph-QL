const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 3000;
app.use(express.json());
require("dotenv").config();

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;

app.get("/", (req, res) => {
  res.send("Hello amigos!!");
});

const shopifyApiUrl = `https://${SHOPIFY_STORE_URL}/admin/api/2025-10/graphql.json`;

const headers = {
  "X-Shopify-Access-Token": ADMIN_API_TOKEN,
  "Content-Type": "application/json",
};

//Task 1
app.post("/api/products",async (req,res)=>{
    
  try
  {
    const endCursor=req.query.after || null;
    const {fields,first=2}=req.body;

    if(!Array.isArray(fields) || fields.length==0)
    {
       return res.status(400).json(
          {
            error:"Please provide the fields array in the request body",
            example:{
              fields:["id","title"],
              first:5
            }
          }
        )
    }

    const nodeFields = fields.join("\n");

    const query=
        `query GetProducts($number:Int!,$after:String){
          products(first:$number,after:$after){
            edges{
              cursor
              node{
                ${nodeFields} 
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }`;

        const response=await axios.post(shopifyApiUrl,
              {
                query,
                variables:{
                    number:first,
                    after:endCursor,
                }
              },
              {headers:headers}
        );

        if (response.data.errors){
          console.error("GraphQL Errors:", response.data.errors);
          return res.status(400).json({ error: "GraphQL query failed" });
        }

        res.json(response.data.data.products);
    }
    catch(err)
    {
       console.log("Error fetching products:", err.message);
       res.status(500).json({ error: "Failed to fetch products from Shopify" });
    }
})

// Task2
app.get("/api/products/variant/:product_id", async (req, res) => {
  const prod_id=req.params.product_id;
  const variantsCursor = req.query.after || null;
  const query = `
    query GetProductWithVariants($productId:String!, $variantsFirst:Int!, $variantsAfter:String) {
      productVariants(first:$variantsFirst,after: $variantsAfter,query:$productId) {
        nodes {
          id
          title
          price
          displayName
          selectedOptions{
            name
            value
          }
       }
        pageInfo {
          startCursor
          endCursor
        }
      }
     }
  `;
  try
  {
      const response = await axios.post(
        shopifyApiUrl,
        {
          query,
          variables: {
            productId: `product_id:${prod_id}`,
            variantsFirst: 2,
            variantsAfter: variantsCursor,
          },
        },
        { headers: headers }
      );

      if(response.data.errors) {
        console.error("GraphQL Errors:", response.data.errors);
        return res.status(400).json({ error: "GraphQL query failed" });
      }

      // res.json(response.data.data.product);
      res.json(response.data.data.productVariants);
  }
  catch(err)
  {
    console.log("Error fetching products:", err.message);
    res.status(500).json({ error: "Failed to fetch products from Shopify" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


 // const graphQuery = `
  //   query{
  //     products(first:10){
  //       edges{
  //         node{
  //           id
  //           title
  //           bodyHtml
  //         }
  //       }
  //     }
  //   }
  // `;

  // const graphQuery = `
  //   query{
  //     products(first:10){
  //       edges{
  //        cursor
  //         node{
  //           id
  //           title
  //           bodyHtml
  //         }
  //       }
  //     }
  //   }
  // `;

  //   const graphQuery = `
  //       query{
  //         products(first:10){
  //           edges{
  //             node{
  //               id
  //               title

  //               images(first: 3) {
  //                 edges {
  //                   node {
  //                     url
  //                     altText
  //                   }
  //                 }
  //               }

  //             }
  //           }
  //         }
  //       }
  //     `;

  // const graphQuery = `
  //   query{
  //     products(first: 10, query: "tag:Winter") {
  //       edges{
  //         node{
  //           id
  //           title
  //           tags
  //         }
  //       }
  //     }
  //   }
  // `;

  //  const query = `
  //   query GetProductWithVariants($productId: ID!, $variantsFirst: Int!, $variantsAfter: String) {
  //     product(id: $productId) {
  //       id
  //       title
  //       variants(first: $variantsFirst, after: $variantsAfter) {
  //         edges {
  //           cursor
  //           node {
  //             id
  //             title
  //             selectedOptions {
  //               name
  //               value
  //             }
  //           }
  //         }
  //         pageInfo {
  //           hasNextPage
  //           endCursor
  //         }
  //       }
  //     }
  //   }
  // `;