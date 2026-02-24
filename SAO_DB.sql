-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema sao_db
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema sao_db
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `sao_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `sao_db` ;

-- -----------------------------------------------------
-- Table `sao_db`.`course`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sao_db`.`course` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `Code` VARCHAR(7) NOT NULL DEFAULT ' ',
  `Name` VARCHAR(50) NOT NULL DEFAULT ' ',
  `Credit_Units` INT NOT NULL DEFAULT '3',
  `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Created_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  `Updated_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  PRIMARY KEY (`ID`),
  UNIQUE INDEX `Code_UNIQUE` (`Code` ASC) VISIBLE,
  UNIQUE INDEX `Name_UNIQUE` (`Name` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sao_db`.`course_prerequisite`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sao_db`.`course_prerequisite` (
  `PREREQUISITE_ID` INT NOT NULL,
  `COURSE_ID` INT NOT NULL,
  `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Created_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  `Updated_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  PRIMARY KEY (`PREREQUISITE_ID`, `COURSE_ID`),
  INDEX `fk_COURSE_PREREQUISITE_COURSE1_idx` (`COURSE_ID` ASC) VISIBLE,
  CONSTRAINT `fk_parent_course`
    FOREIGN KEY (`COURSE_ID`)
    REFERENCES `sao_db`.`course` (`ID`),
  CONSTRAINT `fk_pre_course`
    FOREIGN KEY (`PREREQUISITE_ID`)
    REFERENCES `sao_db`.`course` (`ID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sao_db`.`program`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sao_db`.`program` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `programName` VARCHAR(45) NOT NULL DEFAULT ' ',
  `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Created_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  `Updated_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  PRIMARY KEY (`ID`),
  UNIQUE INDEX `programName_UNIQUE` (`programName` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 1
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sao_db`.`semester`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sao_db`.`semester` (
  `ID` INT NOT NULL,
  `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Created_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  `Updated_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  PRIMARY KEY (`ID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sao_db`.`year`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sao_db`.`year` (
  `ID` INT NOT NULL,
  `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Created_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  `Updated_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  PRIMARY KEY (`ID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sao_db`.`curriculum`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sao_db`.`curriculum` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `PROGRAM_ID` INT NOT NULL,
  `YEAR_ID` INT NOT NULL,
  `SEMESTER_ID` INT NOT NULL,
  `COURSE_ID` INT NOT NULL,
  `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Created_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  `Updated_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  PRIMARY KEY (`ID`),
  UNIQUE INDEX `unique_curriculum_idx` (`PROGRAM_ID` ASC, `YEAR_ID` ASC, `SEMESTER_ID` ASC, `COURSE_ID` ASC) VISIBLE,
  INDEX `fk_CURR_YEAR` (`YEAR_ID` ASC) VISIBLE,
  INDEX `fk_CURR_SEMESTER` (`SEMESTER_ID` ASC) VISIBLE,
  INDEX `fk_CURR_COURSE` (`COURSE_ID` ASC) VISIBLE,
  CONSTRAINT `fk_CURR_COURSE`
    FOREIGN KEY (`COURSE_ID`)
    REFERENCES `sao_db`.`course` (`ID`),
  CONSTRAINT `fk_CURR_PROGRAM`
    FOREIGN KEY (`PROGRAM_ID`)
    REFERENCES `sao_db`.`program` (`ID`),
  CONSTRAINT `fk_CURR_SEMESTER`
    FOREIGN KEY (`SEMESTER_ID`)
    REFERENCES `sao_db`.`semester` (`ID`),
  CONSTRAINT `fk_CURR_YEAR`
    FOREIGN KEY (`YEAR_ID`)
    REFERENCES `sao_db`.`year` (`ID`))
ENGINE = InnoDB
AUTO_INCREMENT = 28
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sao_db`.`student`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sao_db`.`student` (
  `ID_Number` VARCHAR(8) NOT NULL,
  `lastName` VARCHAR(30) NOT NULL DEFAULT ' ',
  `firstName` VARCHAR(30) NOT NULL DEFAULT ' ',
  `fullName` VARCHAR(60) GENERATED ALWAYS AS (concat(`firstName`,_utf8mb4' ',`lastName`)) STORED,
  `Section` VARCHAR(45) NOT NULL DEFAULT ' ',
  `Date_Enrolled` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Created_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  `Updated_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  `currentYear` INT NOT NULL DEFAULT 1,
  `currentSemester` INT NOT NULL DEFAULT 1,
  `Is_Archived` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`ID_Number`),
  INDEX `lastName_index` (`lastName` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sao_db`.`enrollment`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sao_db`.`enrollment` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `Grade` VARCHAR(9) NOT NULL DEFAULT '(Ongoing)',
  `Status` ENUM('Passed', 'Failed', 'Active') NOT NULL DEFAULT 'Active',
  `Created_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Created_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  `Updated_By` VARCHAR(45) NOT NULL DEFAULT 'registrar',
  `STUDENT_ID` VARCHAR(8) NOT NULL,
  `CURRICULUM_ID` INT NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE INDEX `unique_student_curr` (`STUDENT_ID` ASC, `CURRICULUM_ID` ASC) VISIBLE,
  INDEX `fk_enroll_curr_id` (`CURRICULUM_ID` ASC) VISIBLE,
  CONSTRAINT `fk_enroll_curr_id`
    FOREIGN KEY (`CURRICULUM_ID`)
    REFERENCES `sao_db`.`curriculum` (`ID`),
  CONSTRAINT `fk_enroll_student`
    FOREIGN KEY (`STUDENT_ID`)
    REFERENCES `sao_db`.`student` (`ID_Number`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

USE `sao_db` ;

-- -----------------------------------------------------
-- Placeholder table for view `sao_db`.`deanslist`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sao_db`.`deanslist` (`ID Number` INT, `Full Name` INT, `GWA` INT, `Total_Units` INT);

-- -----------------------------------------------------
-- Placeholder table for view `sao_db`.`studenttranscripts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sao_db`.`studenttranscripts` (`Enrollment ID` INT, `ID Number` INT, `Full Name` INT, `Course Code` INT, `Course Title` INT, `Grade` INT, `Status` INT);

-- -----------------------------------------------------
-- procedure AddCourse
-- -----------------------------------------------------

DELIMITER $$
USE `sao_db`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `AddCourse`(
  IN new_COURSE_NAME VARCHAR(50),
  IN new_COURSE_CODE VARCHAR(7),
  IN new_COURSE_UNITS INT
)
BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM COURSE WHERE COURSE.Name = new_COURSE_NAME OR COURSE.Code = new_COURSE_CODE
  ) THEN
      INSERT INTO COURSE (
          Code,
          Name,
          Credit_Units
      )
      VALUES (
          new_COURSE_CODE,
          new_COURSE_NAME,
          new_COURSE_UNITS
      );
    END IF;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure AddCurriculum
-- -----------------------------------------------------

DELIMITER $$
USE `sao_db`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `AddCurriculum`(
    IN entry_PROGRAM_NAME VARCHAR(45),
    IN entry_YEAR INT,
    IN entry_SEMESTER INT,
    IN entry_COURSE_CODE VARCHAR(7)
)
BEGIN
        DECLARE entry_PROGRAM_ID INT;
        DECLARE entry_COURSE_ID INT;
    
        SELECT ID INTO entry_PROGRAM_ID FROM PROGRAM p WHERE p.programName = entry_PROGRAM_NAME;
        SELECT ID INTO entry_COURSE_ID FROM COURSE c WHERE c.Code = entry_COURSE_CODE;

      IF NOT EXISTS (
        SELECT 1 FROM CURRICULUM 
        WHERE CURRICULUM.PROGRAM_ID = entry_PROGRAM_ID
        AND CURRICULUM.YEAR_ID = entry_YEAR
        AND CURRICULUM.SEMESTER_ID = entry_SEMESTER
        AND CURRICULUM.COURSE_ID = entry_COURSE_ID
      ) THEN
          INSERT INTO CURRICULUM (
              PROGRAM_ID, 
              YEAR_ID, 
              SEMESTER_ID, 
              COURSE_ID
          )
          VALUES (
              entry_PROGRAM_ID,
              entry_YEAR,
              entry_SEMESTER,
              entry_COURSE_ID
          );
        END IF;
    END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure AddProgram
-- -----------------------------------------------------

DELIMITER $$
USE `sao_db`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `AddProgram`(
  IN new_PROGRAM_NAME VARCHAR(45)
)
BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM PROGRAM WHERE PROGRAM.programName = new_PROGRAM_NAME
      ) THEN
          INSERT INTO PROGRAM (programName) VALUES (new_PROGRAM_NAME);
      END IF;
  END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure AddStudent
-- -----------------------------------------------------

DELIMITER $$
USE `sao_db`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `AddStudent`(
    IN ID_Number VARCHAR(8),
    IN lastName VARCHAR(30),
    IN firstName VARCHAR(30),
    IN Section VARCHAR(45)
)
BEGIN
    -- Enforce exact ID length at the DB level
    IF CHAR_LENGTH(ID_Number) <> 8 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ID_Number must be exactly 8 characters long.';
    END IF;

    -- Prevent duplicates from silently succeeding
    IF EXISTS (
        SELECT 1 FROM STUDENT WHERE STUDENT.ID_Number = ID_Number
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'A student with this ID_Number already exists.';
    ELSE
        INSERT INTO STUDENT (
            ID_Number,
            lastName,
            firstName,
            Section,
            Created_By,
            Updated_By,
            Is_Archived
        )
        VALUES (
            ID_Number,
            lastName,
            firstName,
            Section,
            'registrar',
            'registrar',
            0
        );
    END IF;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure SetStudentArchived
-- -----------------------------------------------------

DELIMITER $$
USE `sao_db`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `SetStudentArchived`(
    IN p_ID_Number VARCHAR(8),
    IN p_Archived TINYINT(1)
)
BEGIN
    IF CHAR_LENGTH(p_ID_Number) <> 8 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ID_Number must be exactly 8 characters long.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM STUDENT WHERE ID_Number = p_ID_Number) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Student not found for archiving.';
    END IF;

    UPDATE STUDENT
    SET Is_Archived = p_Archived
    WHERE ID_Number = p_ID_Number;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure UpdateStudent
-- -----------------------------------------------------

DELIMITER $$
USE `sao_db`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `UpdateStudent`(
    IN p_ID_Number VARCHAR(8),
    IN p_lastName VARCHAR(30),
    IN p_firstName VARCHAR(30),
    IN p_Section VARCHAR(45),
    IN p_currentYear INT,
    IN p_currentSemester INT
)
BEGIN
    -- Basic ID validation
    IF CHAR_LENGTH(p_ID_Number) <> 8 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ID_Number must be exactly 8 characters long.';
    END IF;

    -- Ensure the student exists
    IF NOT EXISTS (SELECT 1 FROM STUDENT WHERE ID_Number = p_ID_Number) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Student not found for update.';
    END IF;

    UPDATE STUDENT
    SET 
        lastName       = p_lastName,
        firstName      = p_firstName,
        Section        = p_Section,
        currentYear    = p_currentYear,
        currentSemester= p_currentSemester,
        Updated_By     = 'registrar'
    WHERE ID_Number = p_ID_Number;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- function GetNumericGrade
-- -----------------------------------------------------

DELIMITER $$
USE `sao_db`$$
CREATE DEFINER=`root`@`localhost` FUNCTION `GetNumericGrade`(p_grade VARCHAR(9)) RETURNS decimal(3,2)
    DETERMINISTIC
BEGIN
    IF p_grade = 'F' OR p_grade = 'R' OR p_grade IS NULL THEN
        RETURN 0.00;
    ELSEIF (p_grade REGEXP '^[0-9]+(\.[0-9]+)?$') THEN
        RETURN CAST(p_grade AS DECIMAL(3,2));
    ELSE
        RETURN 0.00;
    END IF;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure GradeUpdate
-- -----------------------------------------------------

DELIMITER $$
USE `sao_db`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `GradeUpdate`(
    IN p_Student_Fullname VARCHAR(60),
    IN p_Course_Code VARCHAR(7),
    IN p_RawGrade VARCHAR(9)
)
BEGIN
    DECLARE v_FinalGrade CHAR(9);
    DECLARE v_NumericGrade INT;
    DECLARE v_Enrollment_ID INT DEFAULT NULL;

    IF NOT (p_RawGrade REGEXP '^(\(Ongoing\)|R|F)$' OR p_RawGrade REGEXP '^([1-9]|[1-9][0-9]|100)$') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid Grade Input. Allowed: (Ongoing), R, F, or 1-100.';
    END IF;

    SELECT e.ID INTO v_Enrollment_ID 
    FROM ENROLLMENT e
    JOIN STUDENT s ON e.STUDENT_ID = s.ID_Number 
    JOIN CURRICULUM cu ON e.CURRICULUM_ID = cu.ID
    JOIN COURSE c ON cu.COURSE_ID = c.ID
    WHERE s.fullName = p_Student_Fullname 
      AND c.Code = p_Course_Code
    LIMIT 1; 

    IF v_Enrollment_ID IS NOT NULL THEN
        IF p_RawGrade REGEXP '^([1-9]|[1-9][0-9]|100)$' THEN
            SET v_NumericGrade = CAST(p_RawGrade AS UNSIGNED);
            
            SET v_FinalGrade = CASE 
                WHEN v_NumericGrade BETWEEN 95 AND 100 THEN '4.00'
                WHEN v_NumericGrade BETWEEN 91 AND 94  THEN '3.50'
                WHEN v_NumericGrade BETWEEN 87 AND 90  THEN '3.00'
                WHEN v_NumericGrade BETWEEN 83 AND 86  THEN '2.50'
                WHEN v_NumericGrade BETWEEN 79 AND 82  THEN '2.00'
                WHEN v_NumericGrade BETWEEN 75 AND 78  THEN '1.50'
                WHEN v_NumericGrade BETWEEN 70 AND 74  THEN '1.00'
                ELSE '0.00' 
            END;
        ELSE
            SET v_FinalGrade = p_RawGrade;
        END IF;

        UPDATE ENROLLMENT
        SET Grade = v_FinalGrade,
            Updated_At = NOW(),
            Updated_By = 'registrar'
        WHERE ID = v_Enrollment_ID;
        
    ELSE
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Record not found for this Student and Course Code.';
    END IF;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure StudentEnroll
-- -----------------------------------------------------

DELIMITER $$
USE `sao_db`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `StudentEnroll`(
    IN STUDENT_FULLNAME VARCHAR(60),
    IN COURSE_CODE VARCHAR(50),
    IN PROGRAM_NAME VARCHAR(45),
    IN p_YEAR_ID INT,
    IN p_SEMESTER_ID INT
)
BEGIN
    DECLARE v_student_id VARCHAR(8);
    DECLARE v_curr_id INT;

    SELECT ID_Number INTO v_student_id 
    FROM student 
    WHERE fullName = STUDENT_FULLNAME 
    LIMIT 1;

    SELECT curr.ID INTO v_curr_id 
    FROM curriculum curr 
    JOIN program p ON curr.PROGRAM_ID = p.ID 
    JOIN course c ON curr.COURSE_ID = c.ID
    WHERE p.programName = PROGRAM_NAME 
      AND c.Code = COURSE_CODE
      AND curr.YEAR_ID = p_YEAR_ID
      AND curr.SEMESTER_ID = p_SEMESTER_ID;

    -- 3. Validation and Insertion
    IF v_student_id IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Enrollment Failed: Student name not found.';
        
    ELSEIF v_curr_id IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Enrollment Failed: No curriculum entry matches this Year/Semester/Course.';
        
    ELSE
        INSERT INTO enrollment (
            Grade,
            Status,
            Created_By,
            Updated_By,
            STUDENT_ID,
            CURRICULUM_ID
        )
        VALUES (
            '(Ongoing)',
            'Active',
            'registrar',
            'registrar',
            v_student_id,
            v_curr_id
        );
    END IF;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure StudentEnrollmentsViewer
-- -----------------------------------------------------

DELIMITER $$
USE `sao_db`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `StudentEnrollmentsViewer`(
    IN STUDENT_ID VARCHAR(8)
)
BEGIN
    SELECT
        STUDENT.ID_Number,
        STUDENT.fullName AS 'Full Name',
        STUDENT.Date_Enrolled AS 'Date Enrolled',
        cu.SEMESTER_ID AS 'Semester',
        cu.YEAR_ID AS Year,
        PROGRAM.programName AS 'Program',
        COURSE.Code,
        COURSE.Name AS Course,
        ENROLLMENT.Grade,
        ENROLLMENT.Status
    FROM ENROLLMENT
    JOIN STUDENT
        ON ENROLLMENT.STUDENT_ID = STUDENT.ID_Number
    JOIN CURRICULUM cu
        ON ENROLLMENT.CURRICULUM_ID = cu.ID
    JOIN COURSE
        ON cu.COURSE_ID = COURSE.ID
    JOIN PROGRAM
        ON cu.PROGRAM_ID = PROGRAM.ID
    WHERE STUDENT.ID_Number = STUDENT_ID;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- function calcGWA
-- -----------------------------------------------------

DELIMITER $$
USE `sao_db`$$
CREATE DEFINER=`root`@`localhost` FUNCTION `calcGWA`(
    p_student_id VARCHAR(8)
) RETURNS decimal(5,2)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_total_units INT DEFAULT 0;
    DECLARE v_weighted_sum DECIMAL(12,2) DEFAULT 0.00;

    SELECT 
        SUM(cr.Credit_Units), 
        SUM(GetNumericGrade(enr.Grade) * cr.Credit_Units)
    INTO v_total_units, v_weighted_sum
    FROM ENROLLMENT enr 
    JOIN CURRICULUM cu ON enr.CURRICULUM_ID = cu.ID
    JOIN COURSE cr ON cu.COURSE_ID = cr.ID
    WHERE enr.STUDENT_ID = p_student_id
      AND enr.Grade != '(Ongoing)';

    IF v_total_units > 0 THEN
        RETURN v_weighted_sum / v_total_units;
    ELSE
        RETURN 0.00;
    END IF;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- View `sao_db`.`deanslist`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sao_db`.`deanslist`;
USE `sao_db`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `sao_db`.`deanslist` AS select `s`.`ID_Number` AS `ID Number`,`s`.`fullName` AS `Full Name`,`calcGWA`(`s`.`ID_Number`) AS `GWA`,sum(`cr`.`Credit_Units`) AS `Total_Units` from (((`sao_db`.`student` `s` join `sao_db`.`enrollment` `enr` on((`s`.`ID_Number` = `enr`.`STUDENT_ID`))) join `sao_db`.`curriculum` `cu` on((`enr`.`CURRICULUM_ID` = `cu`.`ID`))) join `sao_db`.`course` `cr` on((`cu`.`COURSE_ID` = `cr`.`ID`))) where (exists(select 1 from `sao_db`.`enrollment` `e2` where ((`e2`.`STUDENT_ID` = `s`.`ID_Number`) and ((`GetNumericGrade`(`e2`.`Grade`) < 2.00) or (`e2`.`Grade` in ('R','F'))))) is false and (`enr`.`Grade` <> '(Ongoing)')) group by `s`.`ID_Number` having ((`GWA` >= 3.50) and (`Total_Units` >= 15));

-- -----------------------------------------------------
-- View `sao_db`.`studenttranscripts`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sao_db`.`studenttranscripts`;
USE `sao_db`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `sao_db`.`studenttranscripts` AS select `e`.`ID` AS `Enrollment ID`,`s`.`ID_Number` AS `ID Number`,`s`.`fullName` AS `Full Name`,`c`.`Code` AS `Course Code`,`c`.`Name` AS `Course Title`,`e`.`Grade` AS `Grade`,`e`.`Status` AS `Status` from (((`sao_db`.`enrollment` `e` join `sao_db`.`student` `s` on((`e`.`STUDENT_ID` = `s`.`ID_Number`))) join `sao_db`.`curriculum` `cu` on((`e`.`CURRICULUM_ID` = `cu`.`ID`))) join `sao_db`.`course` `c` on((`cu`.`COURSE_ID` = `c`.`ID`)));
USE `sao_db`;

DELIMITER $$
USE `sao_db`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `sao_db`.`UpdateCourseTimestamp`
BEFORE UPDATE ON `sao_db`.`course`
FOR EACH ROW
BEGIN
    SET NEW.Updated_At = NOW();
END$$

USE `sao_db`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `sao_db`.`UpdateProgramTimestamp`
BEFORE UPDATE ON `sao_db`.`program`
FOR EACH ROW
BEGIN
    SET NEW.Updated_At = NOW();
END$$

USE `sao_db`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `sao_db`.`UpdateStudentTimestamp`
BEFORE UPDATE ON `sao_db`.`student`
FOR EACH ROW
BEGIN
    SET NEW.Updated_At = NOW();
END$$

USE `sao_db`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `sao_db`.`AutoUpdateStatus`
BEFORE UPDATE ON `sao_db`.`enrollment`
FOR EACH ROW
BEGIN
    DECLARE v_grade_val DECIMAL(3,2);
 
    IF (NEW.Grade <=> OLD.Grade) = 0 THEN 
        IF NEW.Grade = 'F' OR NEW.Grade = 'R' THEN
            SET NEW.Status = 'Failed';
        ELSEIF (NEW.Grade REGEXP '^[0-9]+(.[0-9]+)?$') THEN
            SET v_grade_val = CAST(NEW.Grade AS DECIMAL(3,2));
            IF v_grade_val >= 1.00 THEN
                SET NEW.Status = 'Passed';
            ELSE
                SET NEW.Status = 'Failed';
            END IF;
        ELSE
            SET NEW.Status = 'Active';
        END IF;
    END IF;
END$$

USE `sao_db`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `sao_db`.`CheckPrerequisite`
BEFORE INSERT ON `sao_db`.`enrollment`
FOR EACH ROW
BEGIN
    DECLARE v_course_id INT;
    SELECT COURSE_ID INTO v_course_id FROM curriculum WHERE ID = NEW.CURRICULUM_ID;

    IF EXISTS (
        SELECT 1 FROM COURSE_PREREQUISITE 
        WHERE COURSE_ID = v_course_id
    ) THEN
        IF EXISTS (
            SELECT 1 
            FROM COURSE_PREREQUISITE cp
            WHERE cp.COURSE_ID = v_course_id
              AND cp.PREREQUISITE_ID NOT IN (
                  SELECT cu.COURSE_ID
                  FROM ENROLLMENT e
                  JOIN CURRICULUM cu ON e.CURRICULUM_ID = cu.ID
                  WHERE e.STUDENT_ID = NEW.STUDENT_ID
                    AND e.Status = 'Passed'
              )
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Enrollment Denied: Missing required prerequisites.';
        END IF;
    END IF;
END$$

USE `sao_db`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `sao_db`.`UpdateEnrollmentTimestamp`
BEFORE UPDATE ON `sao_db`.`enrollment`
FOR EACH ROW
BEGIN
    SET NEW.Updated_At = NOW();
END$$


DELIMITER ;

DELIMITER $$

USE `sao_db`$$

CREATE DEFINER=`root`@`localhost` TRIGGER `sao_db`.`AutoAdvanceYearSemester`
AFTER INSERT ON `sao_db`.`enrollment`
FOR EACH ROW
BEGIN
    DECLARE v_enrolled_year INT;
    DECLARE v_enrolled_sem INT;
    DECLARE v_curr_year INT;
    DECLARE v_curr_sem INT;
    
    DECLARE v_pending_year_subjects INT DEFAULT 1;
    DECLARE v_pending_sem_subjects INT DEFAULT 1;
    
    DECLARE v_new_year INT;
    DECLARE v_new_sem INT;

    -- 1. Fetch the Year and Semester of the course the student just enrolled in
    SELECT YEAR_ID, SEMESTER_ID INTO v_enrolled_year, v_enrolled_sem
    FROM curriculum 
    WHERE ID = NEW.CURRICULUM_ID;

    -- 2. Fetch the student's current Year and Semester
    SELECT currentYear, currentSemester INTO v_curr_year, v_curr_sem
    FROM student 
    WHERE ID_Number = NEW.STUDENT_ID;

    -- Initialize the new variables with the current values to start
    SET v_new_year = v_curr_year;
    SET v_new_sem = v_curr_sem;

    -- -----------------------------------------------------
    -- 3. Evaluate Year Update Logic
    -- -----------------------------------------------------
    -- Check if they are enrolling in the immediate next year
    IF v_enrolled_year = v_curr_year + 1 THEN
        -- Count how many subjects from their CURRENT year are NOT Passed and NOT 'R'
        SELECT COUNT(*) INTO v_pending_year_subjects
        FROM enrollment e
        JOIN curriculum c ON e.CURRICULUM_ID = c.ID
        WHERE e.STUDENT_ID = NEW.STUDENT_ID
          AND c.YEAR_ID = v_curr_year
          AND e.Status != 'Passed'
          AND e.Grade != 'R';
          
        -- If all previous year subjects are cleared, increment the year
        IF v_pending_year_subjects = 0 THEN
            SET v_new_year = v_curr_year + 1;
        END IF;
    END IF;

    -- -----------------------------------------------------
    -- 4. Evaluate Semester Update Logic
    -- -----------------------------------------------------
    -- Check if they are enrolling in the immediate next semester 
    -- (If current is 1->2, 2->3, or if 3->1)
    IF v_enrolled_sem = CASE WHEN v_curr_sem = 3 THEN 1 ELSE v_curr_sem + 1 END THEN
        -- Count how many subjects from their CURRENT semester are NOT Passed and NOT 'R'
        SELECT COUNT(*) INTO v_pending_sem_subjects
        FROM enrollment e
        JOIN curriculum c ON e.CURRICULUM_ID = c.ID
        WHERE e.STUDENT_ID = NEW.STUDENT_ID
          AND c.YEAR_ID = v_curr_year
          AND c.SEMESTER_ID = v_curr_sem
          AND e.Status != 'Passed'
          AND e.Grade != 'R';
          
        -- If all previous semester subjects are cleared, advance the semester
        IF v_pending_sem_subjects = 0 THEN
            SET v_new_sem = CASE WHEN v_curr_sem = 3 THEN 1 ELSE v_curr_sem + 1 END;
        END IF;
    END IF;

    -- -----------------------------------------------------
    -- 5. Apply Updates
    -- -----------------------------------------------------
    -- Only run an UPDATE query on the student table if the values actually changed
    IF v_new_year != v_curr_year OR v_new_sem != v_curr_sem THEN
        UPDATE student
        SET currentYear = v_new_year,
            currentSemester = v_new_sem
        WHERE ID_Number = NEW.STUDENT_ID;
    END IF;

END$$

DELIMITER ;
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

/*STUDENTS*/
call AddStudent('2024-001', 'Genova', 'Carl Dheyniel', 'A');
call AddStudent('2024-002', 'James', 'Michael', 'A');
call AddStudent('2024-003', 'Allen', 'Barry', 'A');
call AddStudent('2024-004', 'Einstein', 'Albert', 'B');
call AddStudent('2024-005', 'Euler', 'Leonhard', 'B');

/* BASE SETUP DATA */
INSERT INTO `year` (`ID`) VALUES (1), (2), (3), (4);

INSERT INTO `program` (`programName`) VALUES ('BSCS'), ('BSIT');

INSERT INTO `semester` (`ID`) VALUES (1), (2);

/*COURSES*/
INSERT INTO `course` (`ID`, `Code`, `Name`) VALUES 
(1, 'PROG1', 'Programming 1'), (2, 'PROG2', 'Programming 2'), 
(3, 'WEBDEV1', 'Web Dev 1'), (4, 'WEBDEV2', 'Web Dev 2'), 
(5, 'DATAMA1', 'Database Mgmt 1'), (6, 'DATAMA2', 'Database Mgmt 2');

/*COURSE PREREQUISITES*/
INSERT INTO `course_prerequisite` (`PREREQUISITE_ID`, `COURSE_ID`) VALUES (1, 2), (3, 4), (5, 6);

/* CURRICULUM MAPPING */
INSERT INTO `curriculum` (`PROGRAM_ID`, `YEAR_ID`, `SEMESTER_ID`, `COURSE_ID`) VALUES
(1, 2, 1, 5), (1, 2, 2, 2), (1, 2, 2, 3), (1, 2, 2, 4), (1, 2, 2, 6), (1, 3, 1, 1),
(1, 3, 1, 5), (1, 3, 2, 2), (1, 3, 2, 5), (1, 3, 2, 6), (2, 2, 1, 1), (2, 2, 1, 3),
(2, 2, 1, 5), (2, 2, 2, 1), (2, 2, 2, 2), (2, 2, 2, 3), (2, 2, 2, 4), (2, 2, 2, 5),
(2, 2, 2, 6), (2, 3, 1, 1), (2, 3, 1, 3), (2, 3, 1, 5), (2, 3, 2, 1), (2, 3, 2, 2),
(2, 3, 2, 3), (2, 3, 2, 4), (2, 3, 2, 6);

/*STUDENT ENROLLMENTS*/
Call studentenroll('Carl Dheyniel Genova', 'DATAMA1', 'BSIT', 2, 1);
Call studentenroll('Carl Dheyniel Genova', 'PROG1', 'BSIT', 2, 1);
Call studentenroll('Carl Dheyniel Genova', 'WEBDEV1', 'BSIT', 2, 1);

Call studentenroll('Michael James', 'DATAMA1', 'BSIT', 2, 1);
Call studentenroll('Michael James', 'PROG1', 'BSIT', 2, 1);
Call studentenroll('Michael James', 'WEBDEV1', 'BSIT', 2, 1);

Call studentenroll('Barry Allen', 'DATAMA1', 'BSIT', 2, 1);
Call studentenroll('Barry Allen', 'PROG1', 'BSIT', 2, 1);
Call studentenroll('Barry Allen', 'WEBDEV1', 'BSIT', 2, 1);

Call studentenroll('Albert Einstein', 'DATAMA1', 'BSCS', 2, 1);

Call studentenroll('Leonhard Euler', 'DATAMA1', 'BSCS', 2, 1);