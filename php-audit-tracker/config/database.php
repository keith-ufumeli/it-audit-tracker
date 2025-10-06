<?php
/**
 * Database Configuration and Connection
 * Handles database connection and configuration
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

require_once APP_ROOT . '/config/config.php';

class Database {
    private static $instance = null;
    private $connection = null;
    
    private function __construct() {
        $this->connect();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function connect() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET . " COLLATE " . DB_COLLATE
            ];
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
            
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }
    
    public function getConnection() {
        if ($this->connection === null) {
            $this->connect();
        }
        return $this->connection;
    }
    
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Database query failed: " . $e->getMessage() . " SQL: " . $sql);
            throw new Exception("Database query failed");
        }
    }
    
    public function fetch($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }
    
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    public function insert($table, $data) {
        $columns = implode(',', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        
        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
        $this->query($sql, $data);
        
        return $this->connection->lastInsertId();
    }
    
    public function update($table, $data, $where, $whereParams = []) {
        $setClause = [];
        foreach (array_keys($data) as $key) {
            $setClause[] = "{$key} = :{$key}";
        }
        $setClause = implode(', ', $setClause);
        
        $sql = "UPDATE {$table} SET {$setClause} WHERE {$where}";
        $params = array_merge($data, $whereParams);
        
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }
    
    public function delete($table, $where, $params = []) {
        $sql = "DELETE FROM {$table} WHERE {$where}";
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }
    
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    public function commit() {
        return $this->connection->commit();
    }
    
    public function rollback() {
        return $this->connection->rollback();
    }
    
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }
    
    public function rowCount($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }
    
    // Helper method to check if table exists
    public function tableExists($tableName) {
        $sql = "SHOW TABLES LIKE :table";
        $stmt = $this->query($sql, ['table' => $tableName]);
        return $stmt->rowCount() > 0;
    }
    
    // Helper method to get table structure
    public function getTableStructure($tableName) {
        $sql = "DESCRIBE {$tableName}";
        return $this->fetchAll($sql);
    }
    
    // Helper method to backup database
    public function backup($backupFile) {
        $command = "mysqldump --host=" . DB_HOST . " --user=" . DB_USER . " --password=" . DB_PASS . " " . DB_NAME . " > " . $backupFile;
        return exec($command);
    }
    
    // Helper method to restore database
    public function restore($backupFile) {
        $command = "mysql --host=" . DB_HOST . " --user=" . DB_USER . " --password=" . DB_PASS . " " . DB_NAME . " < " . $backupFile;
        return exec($command);
    }
    
    // Helper method to get database size
    public function getDatabaseSize() {
        $sql = "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'DB Size in MB' FROM information_schema.tables WHERE table_schema = :dbname";
        $result = $this->fetch($sql, ['dbname' => DB_NAME]);
        return $result['DB Size in MB'] ?? 0;
    }
    
    // Helper method to get table sizes
    public function getTableSizes() {
        $sql = "SELECT 
                    table_name AS 'Table',
                    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size in MB'
                FROM information_schema.TABLES 
                WHERE table_schema = :dbname
                ORDER BY (data_length + index_length) DESC";
        return $this->fetchAll($sql, ['dbname' => DB_NAME]);
    }
    
    // Helper method to optimize tables
    public function optimizeTables() {
        $tables = $this->fetchAll("SHOW TABLES");
        $optimized = 0;
        
        foreach ($tables as $table) {
            $tableName = array_values($table)[0];
            $this->query("OPTIMIZE TABLE {$tableName}");
            $optimized++;
        }
        
        return $optimized;
    }
    
    // Helper method to check database health
    public function checkHealth() {
        $health = [
            'connection' => false,
            'tables' => [],
            'size' => 0,
            'last_check' => date('Y-m-d H:i:s')
        ];
        
        try {
            // Test connection
            $this->query("SELECT 1");
            $health['connection'] = true;
            
            // Check tables
            $tables = $this->fetchAll("SHOW TABLES");
            foreach ($tables as $table) {
                $tableName = array_values($table)[0];
                $health['tables'][] = $tableName;
            }
            
            // Get database size
            $health['size'] = $this->getDatabaseSize();
            
        } catch (Exception $e) {
            error_log("Database health check failed: " . $e->getMessage());
        }
        
        return $health;
    }
    
    // Prevent cloning
    private function __clone() {}
    
    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

// Global database instance
function getDB() {
    return Database::getInstance();
}
