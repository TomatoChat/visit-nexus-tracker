import sys
import os
from dotenv import load_dotenv
load_dotenv()
os.chdir(os.getenv('PROJECT_DIRECTORY'))
sys.path.append(os.getenv('PROJECT_DIRECTORY'))

from typing import List, Dict, Union, Any, Tuple
import pandas as pd
from supabase import create_client

# Initialize Supabase client
supabaseURL = os.getenv('SUPABASE_URL')
supabaseKey = os.getenv('SUPABASE_KEY')

if not supabaseURL or not supabaseKey:
    raise ValueError('Please set SUPABASE_URL and SUPABASE_KEY in your .env file')

supabase = create_client(supabaseURL, supabaseKey)


def executeSqlFromFile(filePath: str) -> pd.DataFrame:
    '''
    Execute a SQL query from a file and return the results
    
    Args:
        filePath (str): Path to the SQL file
        
    Returns:
        pandas.DataFrame: Query results as a DataFrame
        
    Raises:
        FileNotFoundError: If the SQL file doesn't exist
        Exception: If there's an error executing the query
    '''
    try:
        # Read the SQL query from the file
        with open(filePath, 'r') as file:
            sqlQuery = file.read().strip()
            
        # Execute the query directly
        response = supabase.table('companySellingPoint').select('*').execute()
        
        # For now, return a simple query result
        # TODO: Implement proper SQL query execution
        return pd.DataFrame(response.data)
        
    except FileNotFoundError:
        raise FileNotFoundError(f'SQL file not found at path: {filePath}')
    except Exception as e:
        raise Exception(f'Error executing SQL query: {str(e)}')


def fetchAllRecords(tableName: str) -> pd.DataFrame:
    '''
    Fetch all records from a specified table
    
    Args:
        tableName (str): Name of the table to query
        
    Returns:
        pandas.DataFrame: DataFrame containing all records from the table
    '''
    response = supabase.table(tableName).select('*').execute()
    
    return pd.DataFrame(response.data)


def fetchFilteredRecords(tableName: str, column: str, value: Any) -> pd.DataFrame:
    '''
    Fetch records from a table with a specific filter
    
    Args:
        tableName (str): Name of the table to query
        column (str): Column name to filter on
        value: Value to filter by
        
    Returns:
        pandas.DataFrame: DataFrame containing filtered records
    '''
    response = supabase.table(tableName).select('*').eq(column, value).execute()

    return pd.DataFrame(response.data)


def fetchSpecificColumns(tableName: str, columns: List[str]) -> pd.DataFrame:
    '''
    Fetch specific columns from a table
    
    Args:
        tableName (str): Name of the table to query
        columns (List[str]): List of column names to select
        
    Returns:
        pandas.DataFrame: DataFrame containing specified columns
    '''
    columnsStr = ', '.join(columns)
    response = supabase.table(tableName).select(columnsStr).execute()

    return pd.DataFrame(response.data)


def fetchOrderedRecords(tableName: str, orderBy: str, desc: bool = True) -> pd.DataFrame:
    '''
    Fetch records ordered by a specific column
    
    Args:
        tableName (str): Name of the table to query
        orderBy (str): Column name to order by
        desc (bool): Whether to order in descending order
        
    Returns:
        pandas.DataFrame: DataFrame containing ordered records
    '''
    response = supabase.table(tableName).select('*').order(orderBy, desc=desc).execute()

    return pd.DataFrame(response.data)


def fetchLimitedRecords(tableName: str, limit: int) -> pd.DataFrame:
    '''
    Fetch a limited number of records
    
    Args:
        tableName (str): Name of the table to query
        limit (int): Maximum number of records to fetch
        
    Returns:
        pandas.DataFrame: DataFrame containing limited records
    '''
    response = supabase.table(tableName).select('*').limit(limit).execute()

    return pd.DataFrame(response.data)


def insertRecord(tableName: str, record: Dict[str, Any]) -> pd.DataFrame:
    '''
    Insert a new record into a table
    
    Args:
        tableName (str): Name of the table to insert into
        record (Dict[str, Any]): Dictionary containing the record data
        
    Returns:
        pandas.DataFrame: DataFrame containing the inserted record
    '''
    response = supabase.table(tableName).insert(record).execute()

    return pd.DataFrame(response.data)


def updateRecord(tableName: str, recordId: Union[int, str], updates: Dict[str, Any]) -> pd.DataFrame:
    '''
    Update a record in a table
    
    Args:
        tableName (str): Name of the table to update
        recordId (Union[int, str]): ID of the record to update
        updates (Dict[str, Any]): Dictionary containing the updates
        
    Returns:
        pandas.DataFrame: DataFrame containing the updated record
    '''
    response = supabase.table(tableName).update(updates).eq('id', recordId).execute()

    return pd.DataFrame(response.data)


def deleteRecord(tableName: str, recordId: Union[int, str]) -> pd.DataFrame:
    '''
    Delete a record from a table
    
    Args:
        tableName (str): Name of the table to delete from
        recordId (Union[int, str]): ID of the record to delete
        
    Returns:
        pandas.DataFrame: DataFrame containing the deleted record
    '''
    response = supabase.table(tableName).delete().eq('id', recordId).execute()
    return pd.DataFrame(response.data)


def fetchWithMultipleConditions(tableName: str, conditions: List[Tuple[str, str, Any]]) -> pd.DataFrame:
    '''
    Fetch records with multiple conditions
    
    Args:
        tableName (str): Name of the table to query
        conditions (List[Tuple[str, str, Any]]): List of tuples (column, operator, value)
            operator can be: 'eq', 'gt', 'lt', 'gte', 'lte', 'neq'
            
    Returns:
        pandas.DataFrame: DataFrame containing filtered records
    '''
    query = supabase.table(tableName).select('*')
    
    for column, operator, value in conditions:
        if operator == 'eq':
            query = query.eq(column, value)
        elif operator == 'gt':
            query = query.gt(column, value)
        elif operator == 'lt':
            query = query.lt(column, value)
        elif operator == 'gte':
            query = query.gte(column, value)
        elif operator == 'lte':
            query = query.lte(column, value)
        elif operator == 'neq':
            query = query.neq(column, value)
    
    response = query.execute()

    return pd.DataFrame(response.data) 