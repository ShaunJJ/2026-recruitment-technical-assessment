import express, { Request, Response } from "express";
import { sourceMapsEnabled } from "process";
import { stringify } from "querystring";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: any = new Map();

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null | string[] => {
  if (recipeName.length == 0) 
    {
      return null;   
    };
  recipeName = recipeName.replace(/[_-]/g, ' ').replace(/[^a-zA-Z\s]/g, '').toLowerCase();
  let recipeNameSplit : string[] = recipeName.split(" ");
  recipeNameSplit = recipeNameSplit.map((word: string): string => word.charAt(0).toUpperCase() + word.slice(1));
  recipeNameSplit = recipeNameSplit.filter((word:string) => word !== "");
  recipeName = recipeNameSplit.join(" ");
  return recipeName
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  if (!isEntry(req.body)) {
    res.status(400).send("Not valid Entry!");
    return;
  }
  const entry: recipe | ingredient = req.body;
  if (cookbook.has(entry.name)) {
    res.status(400).send("Duplicate Entry!");
    return;
  }
  if (entry.type === "recipe" && 'requiredItems' in entry) {
    const seen: Set<string> = new Set();
    for (const item of entry.requiredItems) {
      if (seen.has(item.name)) {
        res.status(400).send("Non-Unique Required Items!");
        return;
      }
      seen.add(item.name);
    }
  } else if (entry.type === "ingredient" && 'cookTime' in entry) {
    if (entry.cookTime < 0) {
      res.status(400).send("Invalid CookTime!");
      return;
    }
  } else {
    res.status(400).send("Invalid Type!");
    return;
  }
  cookbook.set(entry.name, entry);
  res.status(200).send({});
  return;
});

const isEntry = (e: any): boolean => {
  if ('name' in e && 'type' in e && ('requiredItems' in e || 'cookTime' in e)) {
    return true;
  }
  return false;
}
// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  res.status(500).send("not yet implemented!")

});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
