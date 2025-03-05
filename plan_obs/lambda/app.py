import json
import boto3
import os
from uuid import uuid4

# Initialize DynamoDB
dynamodb = boto3.resource("dynamodb")
table_name = "Plans"
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    """Handles API Gateway requests for CRUD operations."""
    http_method = event.get("httpMethod")
    path_params = event.get("pathParameters")
    body = json.loads(event.get("body", "{}"))

    if http_method == "POST":
        return create_plan(body)
    elif http_method == "GET":
        return get_plan(path_params)
    elif http_method == "PUT":
        return update_plan(path_params, body)
    elif http_method == "DELETE":
        return delete_plan(path_params)
    else:
        return response(400, {"message": "Invalid HTTP method"})

# ---- CRUD Functions ----

def create_plan(body):
    """Creates a new plan."""
    plan_id = str(uuid4())  # Generate unique ID
    body["id"] = plan_id
    table.put_item(Item=body)
    return response(201, {"message": "Plan created", "id": plan_id})

def get_plan(path_params):
    """Fetches a single plan or all plans."""
    if path_params and "id" in path_params:
        plan_id = path_params["id"]
        result = table.get_item(Key={"id": plan_id})
        if "Item" in result:
            return response(200, result["Item"])
        return response(404, {"message": "Plan not found"})
    
    # Fetch all plans if no ID is provided
    result = table.scan()
    return response(200, result.get("Items", []))

def update_plan(path_params, body):
    """Updates an existing plan."""
    if not path_params or "id" not in path_params:
        return response(400, {"message": "Plan ID required"})
    
    plan_id = path_params["id"]
    body["id"] = plan_id
    table.put_item(Item=body)
    return response(200, {"message": "Plan updated", "id": plan_id})

def delete_plan(path_params):
    """Deletes a plan."""
    if not path_params or "id" not in path_params:
        return response(400, {"message": "Plan ID required"})
    
    plan_id = path_params["id"]
    table.delete_item(Key={"id": plan_id})
    return response(200, {"message": "Plan deleted", "id": plan_id})

# ---- Helper Functions ----

def response(status_code, body):
    """Formats an API Gateway response."""
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }
